import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'

export default function PurchasePage() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')

  const [id, setId] = useState('')
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [supplierName, setSupplierName] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('0')
  const [productId, setProductId] = useState('')

  async function fetchPurchases() {
    const data = await apiFetch('/api/purchases')
    setPurchases(data.purchases || [])
  }

  async function fetchProducts() {
    const data = await apiFetch('/api/products')
    setProducts(data.products || [])
  }

  useEffect(() => {
    setMessage('')
    Promise.all([fetchPurchases(), fetchProducts()]).catch(e => setMessage(e.message))
  }, [])

  function clearFields() {
    setId('')
    setItemName('')
    setCategory('')
    setQuantity('0')
    setSupplierName('')
    setPurchaseDate('')
    setPricePerUnit('0')
    setProductId('')
  }

  function handleSelectPurchase(p) {
    setId(p.id)
    setItemName(p.item_name)
    setCategory(p.category || '')
    setQuantity(String(p.quantity))
    setSupplierName(p.supplier_name || '')
    setPurchaseDate(p.purchase_date || '')
    setPricePerUnit(String(p.price_per_unit))
    setProductId(p.product_id || '')
  }

  async function handleAdd() {
    setMessage('')
    try {
      await apiFetch('/api/purchases', {
        method: 'POST',
        body: {
          item_name: itemName,
          category,
          quantity: Number(quantity),
          supplier_name: supplierName,
          purchase_date: purchaseDate,
          price_per_unit: Number(pricePerUnit),
          product_id: productId || null
        }
      })
      setMessage('Purchase added successfully (stock incremented if linked)')
      clearFields()
      await fetchPurchases()
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleUpdate() {
    setMessage('')
    if (!id) {
      setMessage('Select a purchase to update')
      return
    }
    try {
      await apiFetch(`/api/purchases/${id}`, {
        method: 'PUT',
        body: {
          item_name: itemName,
          category,
          quantity: Number(quantity),
          supplier_name: supplierName,
          purchase_date: purchaseDate,
          price_per_unit: Number(pricePerUnit)
        }
      })
      setMessage('Purchase updated successfully')
      clearFields()
      await fetchPurchases()
    } catch(e) {
      setMessage(e.message)
    }
  }

  async function handleDelete() {
    setMessage('')
    if (!id) {
      setMessage('Select a purchase to delete')
      return
    }
    if (!window.confirm('Delete this purchase?')) return
    try {
      await apiFetch(`/api/purchases/${id}`, { method: 'DELETE' })
      setMessage('Purchase deleted successfully')
      clearFields()
      await fetchPurchases()
    } catch(e) {
      setMessage(e.message)
    }
  }

  return (
    <div className="section" style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
      <h2>Purchase Details</h2>
      <div className="card" style={{ background: 'rgba(255,255,255,0.12)' }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Item Name</label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Product Link (Optional ID)</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">-- None --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </select>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Quantity</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Price Per Unit</label>
            <input type="number" step="0.01" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Total Price (Auto-calc)</label>
            <input disabled value={(Number(quantity) * Number(pricePerUnit)).toFixed(2)} style={{ background: '#e9ecef', color: '#495057' }} />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Supplier Name</label>
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>Purchase Date</label>
            <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <button onClick={handleAdd} className="success">Add Record</button>
            <button onClick={handleUpdate} className="secondary">Update</button>
            <button onClick={handleDelete} className="danger">Delete</button>
            <button onClick={clearFields} className="secondary">Clear</button>
          </div>
        </div>
      </div>

      {message && <div className="message" style={{ margin: '12px 0', background: message.includes('successfully') ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)' }}>{message}</div>}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price/Unit</th>
              <th>Total</th>
              <th>Supplier</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} className="clickable" onClick={() => handleSelectPurchase(p)} style={id === p.id ? { outline: '2px solid rgba(74,144,226,0.8)' } : {}}>
                <td>{p.id}</td>
                <td>{p.item_name}</td>
                <td>{p.category}</td>
                <td>{p.quantity}</td>
                <td>${Number(p.price_per_unit).toFixed(2)}</td>
                <td>${Number(p.total_price).toFixed(2)}</td>
                <td>{p.supplier_name}</td>
                <td>{p.purchase_date}</td>
              </tr>
            ))}
            {purchases.length === 0 && <tr><td colSpan="8" style={{ padding: 16 }}>No purchase records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
