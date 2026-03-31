import React, { useEffect, useMemo, useState } from 'react'
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

export default function AdminPanelPage() {
  const [tab, setTab] = useState('users') // users | products
  const [message, setMessage] = useState('')

  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [userSearch, setUserSearch] = useState('')
  const [productSearchId, setProductSearchId] = useState('')

  async function fetchUsers() {
    const data = await apiFetch('/api/admin/users')
    setUsers(data.users || [])
  }

  async function fetchProducts() {
    const data = await apiFetch('/api/admin/products')
    setProducts(data.products || [])
  }

  useEffect(() => {
    setMessage('')
    Promise.all([fetchUsers(), fetchProducts()]).catch((e) => {
      setMessage(e.message)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedProductUserId = selectedProduct ? selectedProduct.userId : null

  async function handleDeleteUser() {
    setMessage('')
    if (!selectedUser) {
      setMessage('Please select a user to delete')
      return
    }
    if (
      !window.confirm(
        `Are you sure you want to delete user: ${selectedUser.name} (${selectedUser.email})?\nThis will also delete all their products.`
      )
    ) {
      return
    }

    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' })
      setMessage('User deleted successfully')
      setSelectedUser(null)
      await fetchUsers()
      await fetchProducts()
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleDeleteSelectedProduct() {
    setMessage('')
    if (!selectedProduct) {
      setMessage('Please select a product to delete')
      return
    }
    if (!window.confirm(`Are you sure you want to delete product: ${selectedProduct.name}?`)) return

    try {
      await apiFetch(`/api/admin/products/${encodeURIComponent(selectedProduct.id)}?userId=${selectedProduct.userId}`, {
        method: 'DELETE',
      })
      setMessage('Product deleted successfully')
      setSelectedProduct(null)
      await fetchProducts()
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleDeleteAllProducts() {
    setMessage('')
    if (!window.confirm('Are you sure you want to delete ALL products?\nThis action cannot be undone!')) return
    try {
      await apiFetch('/api/admin/products/delete-all', { method: 'POST' })
      setMessage('All products deleted successfully')
      setSelectedProduct(null)
      await fetchProducts()
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleSearchUsers() {
    setMessage('')
    const q = userSearch.trim()
    if (!q) {
      setMessage('Please enter a username to search')
      return
    }
    const data = await apiFetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`)
    setUsers(data.users || [])
    setSelectedUser(null)
  }

  async function handleShowAllUsers() {
    setMessage('')
    setUserSearch('')
    await fetchUsers()
  }

  async function handleSearchProducts() {
    setMessage('')
    const q = productSearchId.trim()
    if (!q) {
      setMessage('Please enter a product ID to search')
      return
    }
    const data = await apiFetch(`/api/admin/products/search?id=${encodeURIComponent(q)}`)
    setProducts(data.products || [])
    setSelectedProduct(null)
  }

  async function handleShowAllProducts() {
    setMessage('')
    setProductSearchId('')
    await fetchProducts()
  }

  async function handleLogout() {
    await apiFetch('/api/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Admin Panel</h2>
          <div className="row">
            <button className={tab === 'users' ? '' : 'secondary'} onClick={() => setTab('users')}>
              Users
            </button>
            <button className={tab === 'products' ? '' : 'secondary'} onClick={() => setTab('products')}>
              Products
            </button>
            <button className="danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message ? (
          <div className="message" style={{ marginTop: 12, background: 'rgba(231,76,60,0.15)' }}>
            {message}
          </div>
        ) : null}

        {tab === 'users' ? (
          <div className="section" style={{ marginTop: 14 }}>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Search Users (name/email)</label>
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
              <button onClick={handleSearchUsers}>Search</button>
              <button onClick={handleShowAllUsers} className="secondary">
                Show All
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className={selectedUser?.id === u.id ? 'clickable' : 'clickable'}
                        onClick={() => {
                          setSelectedUser(u)
                          setSelectedProduct(null)
                        }}
                        style={
                          selectedUser?.id === u.id
                            ? { outline: '2px solid rgba(74,144,226,0.8)' }
                            : undefined
                        }
                      >
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.createdAt ?? '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: 16 }}>
                        No users
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button className="danger" onClick={handleDeleteUser} disabled={!selectedUser}>
                Delete Selected User
              </button>
            </div>
          </div>
        ) : (
          <div className="section" style={{ marginTop: 14 }}>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Search Products (ID contains)</label>
                <input value={productSearchId} onChange={(e) => setProductSearchId(e.target.value)} />
              </div>
              <button onClick={handleSearchProducts}>Search</button>
              <button onClick={handleShowAllProducts} className="secondary">
                Show All
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>User ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? (
                    products.map((p) => {
                      const status = getStockStatus(p)
                      return (
                        <tr
                          key={`${p.id}:${p.userId}`}
                          onClick={() => setSelectedProduct(p)}
                          style={
                            selectedProduct?.id === p.id && selectedProduct?.userId === p.userId
                              ? { outline: '2px solid rgba(74,144,226,0.8)' }
                              : undefined
                          }
                          className={
                            status === 'CRITICAL' ? 'status-critical' : status === 'LOW' ? 'status-low' : status === 'MEDIUM' ? 'status-medium' : ''
                          }
                        >
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.price}</td>
                          <td>{p.quantity}</td>
                          <td>{p.userId}</td>
                          <td>{status}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: 16 }}>
                        No products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button className="danger" onClick={handleDeleteSelectedProduct} disabled={!selectedProduct}>
                Delete Selected Product
              </button>
              <button className="danger" onClick={handleDeleteAllProducts}>
                Delete All Products
              </button>
            </div>
          </div>
        )}
        {selectedProductUserId ? null : null}
      </div>
    </div>
  )
}

