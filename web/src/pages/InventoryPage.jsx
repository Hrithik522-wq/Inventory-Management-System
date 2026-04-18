import React, { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../api/client.js'

function getStockStatus(p) {
  const threshold = Number(p.lowStockThreshold ?? 10)
  const alertEnabled = !!p.alertEnabled
  const qty = Number(p.quantity)
  if (!alertEnabled) return 'GOOD'
  if (qty === 0) return 'CRITICAL'
  if (qty <= threshold) return 'LOW'
  if (qty > threshold && qty <= threshold * 1.5) return 'MEDIUM'
  return 'GOOD'
}

function statusClass(status) {
  if (status === 'CRITICAL') return 'status-critical'
  if (status === 'LOW') return 'status-low'
  if (status === 'MEDIUM') return 'status-medium'
  return ''
}

function stockAlertText(product) {
  return `Product: ${product.name} (ID: ${product.id})\nCurrent Quantity: ${product.quantity}\nLow Stock Threshold: ${product.lowStockThreshold}\n\nPlease consider restocking this item.`
}

export default function InventoryPage() {
  const [message, setMessage] = useState('')

  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  const [view, setView] = useState('all') // all | lowStock | fullStock | search
  const [searchId, setSearchId] = useState('')

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('0')
  const [quantity, setQuantity] = useState('0')
  const [threshold, setThreshold] = useState('10')
  const [alertEnabled, setAlertEnabled] = useState(true)
  const [categoryId, setCategoryId] = useState(null)
  const [supplierId, setSupplierId] = useState(null)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [modalItems, setModalItems] = useState([])

  const didShowAlerts = useRef(false)
  const categoryMap = useMemo(() => {
    const map = new Map()
    for (const c of categories) map.set(c.id, c.name)
    return map
  }, [categories])
  const supplierMap = useMemo(() => {
    const map = new Map()
    for (const s of suppliers) map.set(s.id, s.name)
    return map
  }, [suppliers])

  const tableProducts = useMemo(() => {
    if (view === 'lowStock') return lowStockProducts
    if (view === 'fullStock') {
        const lowIds = new Set(lowStockProducts.map(p => p.id))
        return products.filter(p => !lowIds.has(p.id))
    }
    return products
  }, [view, lowStockProducts, products])

  async function refreshCategoriesSuppliers() {
    const [catRes, supRes] = await Promise.all([apiFetch('/api/categories'), apiFetch('/api/suppliers')])
    setCategories(catRes.categories || [])
    setSuppliers(supRes.suppliers || [])
  }

  async function refreshProducts() {
    const data = await apiFetch('/api/products')
    setProducts(data.products || [])
  }

  async function refreshLowStock() {
    const data = await apiFetch('/api/products/low-stock')
    const list = data.products || []
    setLowStockProducts(list)
    return list
  }

  function clearFields() {
    setId('')
    setName('')
    setPrice('0')
    setQuantity('0')
    setThreshold('10')
    setAlertEnabled(true)
    setCategoryId(null)
    setSupplierId(null)
    setSelectedProduct(null)
  }

  function setFieldsFromProduct(p) {
    setSelectedProduct(p)
    setId(p.id || '')
    setName(p.name || '')
    setPrice(String(p.price ?? 0))
    setQuantity(String(p.quantity ?? 0))
    setThreshold(String(p.lowStockThreshold ?? 10))
    setAlertEnabled(!!p.alertEnabled)
    setCategoryId(p.categoryId ?? null)
    setSupplierId(p.supplierId ?? null)
  }

  function showLowStockAlert(product) {
    window.alert(stockAlertText(product))
  }

  function showLowStockAlerts(list) {
    if (didShowAlerts.current) return
    const itemsToAlert = list.filter(p => !!p.alertEnabled)
    if (itemsToAlert.length > 0) {
      setModalItems(itemsToAlert)
      setShowStockModal(true)
      didShowAlerts.current = true
    }
  }

  async function refreshAllAndOptionallyAlerts({ showAlerts } = { showAlerts: false }) {
    setMessage('')
    const [_, lowStockList] = await Promise.all([refreshProducts(), refreshLowStock()])
    await refreshCategoriesSuppliers()
    if (showAlerts) {
      didShowAlerts.current = false
      showLowStockAlerts(lowStockList)
    }
  }

  useEffect(() => {
    refreshAllAndOptionallyAlerts({ showAlerts: true }).catch((e) => {
      setMessage(e.message)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lowStockCountLabel = useMemo(() => {
    const count = lowStockProducts.length
    if (count === 0) return 'No low stock items'
    return `${count} item(s) running low on stock`
  }, [lowStockProducts])

  async function handleAddCategory() {
    const newName = window.prompt('Enter new category name:')
    if (newName === null) return
    const desc = window.prompt('Description (optional):') ?? ''
    const nameTrim = newName.trim()
    if (!nameTrim) return
    await apiFetch('/api/categories', { method: 'POST', body: { name: nameTrim, description: desc } })
    await refreshCategoriesSuppliers()
    setMessage(`Category '${nameTrim}' added successfully`)
  }

  async function handleAddSupplier() {
    const newName = window.prompt('Enter supplier name:')
    if (newName === null) return
    const contactPerson = window.prompt('Contact person (optional):') ?? ''
    const phone = window.prompt('Phone (optional):') ?? ''
    const email = window.prompt('Email (optional):') ?? ''
    const address = window.prompt('Address (optional):') ?? ''
    const nameTrim = newName.trim()
    if (!nameTrim) return
    await apiFetch('/api/suppliers', {
      method: 'POST',
      body: { name: nameTrim, contactPerson, phone, email, address },
    })
    await refreshCategoriesSuppliers()
    setMessage(`Supplier '${nameTrim}' added successfully`)
  }

  async function handleAddProduct() {
    setMessage('')
    try {
      const idTrim = id.trim()
      const nameTrim = name.trim()
      if (!idTrim || !nameTrim) {
        setMessage('Please enter Product ID and Name')
        return
      }

      let parsedPrice = 0
      try {
        const p = price.trim()
        parsedPrice = p === '' ? 0 : Number(p)
        if (Number.isNaN(parsedPrice)) throw new Error('bad')
      } catch {
        setMessage('Please enter a valid number for Price')
        return
      }

      let parsedQty = 0
      try {
        const q = quantity.trim()
        parsedQty = q === '' ? 0 : Number(q)
        if (!Number.isInteger(parsedQty)) parsedQty = Math.trunc(parsedQty)
      } catch {
        setMessage('Please enter a valid number for Quantity')
        return
      }

      let parsedThreshold = 10
      try {
        const t = threshold.trim()
        parsedThreshold = t === '' ? 10 : Number(t)
        if (Number.isNaN(parsedThreshold)) throw new Error('bad')
      } catch {
        setMessage('Please enter a valid number for Low Stock Threshold (or leave empty for 10)')
        return
      }

      if (!selectedProduct && parsedQty < -2147483648) {
        // keep behavior lenient; just prevent extreme junk
      }

      await apiFetch('/api/products', {
        method: 'POST',
        body: {
          id: idTrim,
          name: nameTrim,
          price: parsedPrice,
          quantity: parsedQty,
          threshold: parsedThreshold,
          alertEnabled: !!alertEnabled,
          categoryId,
          supplierId,
        },
      })

      const productForAlert = {
        id: idTrim,
        name: nameTrim,
        quantity: parsedQty,
        lowStockThreshold: parsedThreshold,
        alertEnabled: !!alertEnabled,
      }

      setMessage('Product added successfully')
      clearFields()
      await Promise.all([refreshProducts(), refreshLowStock()])

      if (!!alertEnabled && parsedQty <= parsedThreshold) {
        showLowStockAlert(productForAlert)
      }
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleUpdateProduct() {
    setMessage('')
    try {
      const idTrim = id.trim()
      const qtyText = quantity.trim()
      if (!idTrim) {
        setMessage('Please enter Product ID')
        return
      }
      if (!qtyText) {
        setMessage('Please enter new quantity')
        return
      }
      const newQuantity = Number(qtyText)
      if (Number.isNaN(newQuantity)) {
        setMessage('Please enter a valid number for quantity')
        return
      }

      const data = await apiFetch(`/api/products/${encodeURIComponent(idTrim)}/quantity`, {
        method: 'PUT',
        body: { quantity: newQuantity },
      })

      setMessage('Product quantity updated successfully')
      clearFields()
      await Promise.all([refreshProducts(), refreshLowStock()])

      const updatedProduct = data.product
      if (updatedProduct && updatedProduct.alertEnabled && updatedProduct.quantity <= updatedProduct.lowStockThreshold) {
        showLowStockAlert(updatedProduct)
      }
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleDeleteProduct() {
    setMessage('')
    const idTrim = id.trim()
    if (!idTrim) {
      setMessage('Please select a product to delete')
      return
    }
    if (!window.confirm(`Are you sure you want to delete product: ${idTrim}?`)) return

    try {
      await apiFetch(`/api/products/${encodeURIComponent(idTrim)}`, { method: 'DELETE' })
      setMessage('Product deleted successfully')
      clearFields()
      await Promise.all([refreshProducts(), refreshLowStock()])
      setView('all')
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleSearch() {
    setMessage('')
    const search = searchId.trim()
    if (!search) {
      setMessage('Please enter a product ID to search')
      return
    }
    const data = await apiFetch(`/api/products/search?id=${encodeURIComponent(search)}`)
    const results = data.products || []
    setProducts(results)
    setView('search')
    if (results.length === 0) setMessage(`No product found with ID: ${search}`)
    else setMessage(`Found ${results.length} product(s)`)
  }

  async function handleShowAll() {
    setSearchId('')
    setView('all')
    await refreshProducts()
    setMessage('Showing all products')
  }

  async function handleViewLowStock() {
    setView('lowStock')
    setMessage(`Showing ${lowStockProducts.length} low stock item(s)`)
  }

  async function handleViewFullStock() {
    const lowIds = new Set(lowStockProducts.map(p => p.id))
    const fullCount = products.filter(p => !lowIds.has(p.id)).length
    setView('fullStock')
    setMessage(`Showing ${fullCount} full stock item(s)`)
  }

  async function handleLogout() {
    await apiFetch('/api/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 520 }}>
            <h2 style={{ marginTop: 0 }}>Product Management</h2>

            <div className="section">
              <div className="row" style={{ alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label>Search Products</label>
                  <input
                    placeholder="Enter Product ID to search..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                </div>
                <button onClick={handleSearch} style={{ whiteSpace: 'nowrap' }}>
                  Search
                </button>
              </div>

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button onClick={handleShowAll} className="secondary" style={{ visibility: view === 'all' ? 'hidden' : 'visible' }}>
                  Back
                </button>
                <div className="row" style={{ gap: 10 }}>
                  <button onClick={handleViewFullStock} className="success">
                    View Full Stock Items
                  </button>
                  <button onClick={handleViewLowStock} className="warn">
                    View Low Stock Items
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: 16, background: 'rgba(255,255,255,0.12)' }}>
                <h3 style={{ marginTop: 0 }}>Product Details</h3>

                <div className="row">
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Product ID</label>
                    <input value={id} onChange={(e) => setId(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Price</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Quantity</label>
                    <input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Low Stock Threshold</label>
                    <input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="e.g. 10 (optional)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Category</label>
                    <select
                      value={categoryId ?? ''}
                      onChange={(e) => setCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="">-- None --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Supplier</label>
                    <select
                      value={supplierId ?? ''}
                      onChange={(e) => setSupplierId(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="">-- None --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label>Alert Enabled</label>
                    <select value={alertEnabled ? 'true' : 'false'} onChange={(e) => setAlertEnabled(e.target.value === 'true')}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                  <button className="secondary" onClick={handleAddCategory} style={{ paddingLeft: 14, paddingRight: 14 }}>
                    + Add Category
                  </button>
                  <button className="secondary" onClick={handleAddSupplier} style={{ paddingLeft: 14, paddingRight: 14 }}>
                    + Add Supplier
                  </button>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button onClick={handleAddProduct}>Add</button>
                  <button onClick={handleUpdateProduct} className="secondary">
                    Update
                  </button>
                  <button onClick={handleDeleteProduct} className="danger">
                    Delete
                  </button>
                  <button onClick={handleLogout} className="danger">
                    Logout
                  </button>
                </div>
              </div>

              {message ? (
                <div className="message" style={{ marginTop: 12, background: 'rgba(231,76,60,0.15)' }}>
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 520 }}>
            <div className="section">
              <div className="card" style={{ padding: 16, background: 'rgba(231,76,60,0.18)' }}>
                <h3 style={{ margin: 0 }}>Low Stock Alerts</h3>
                <div className="muted" style={{ marginTop: 8, fontWeight: 800 }}>
                  {lowStockCountLabel}
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Threshold</th>
                      <th>Category</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableProducts.length ? (
                      tableProducts.map((p) => {
                        const status = getStockStatus(p)
                        return (
                          <tr
                            key={p.id}
                            className={`clickable ${statusClass(status)}`}
                            onClick={() => setFieldsFromProduct(p)}
                          >
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.price}</td>
                            <td>{p.quantity}</td>
                            <td>{p.lowStockThreshold}</td>
                            <td>{p.categoryId ? categoryMap.get(p.categoryId) || '-' : '-'}</td>
                            <td>{p.supplierId ? supplierMap.get(p.supplierId) || '-' : '-'}</td>
                            <td>{status}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ padding: 16 }}>
                          No products to display
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="muted">View: {view}</div>
            </div>
          </div>
        </div>
      </div>

      {showStockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowStockModal(false)}>&times;</button>
            <h2 style={{ marginTop: 0, color: 'var(--danger)' }}>⚠️ Low Stock Alert</h2>
            <p className="muted"> The following items have reached their low stock threshold:</p>
            
            <ul className="alert-list">
              {modalItems.map(item => (
                <li key={item.id} className="alert-item">
                  <div className="alert-item-info">
                    <span className="alert-item-name">{item.name}</span>
                    <span className="alert-item-qty">Current: {item.quantity} | Threshold: {item.lowStockThreshold}</span>
                  </div>
                  <button className="warn" style={{ padding: '6px 14px', fontSize: '0.8em' }} onClick={() => { setShowStockModal(false); setFieldsFromProduct(item); }}>
                    Restock
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <button className="secondary" onClick={() => setShowStockModal(false)}>Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

