import React, { useEffect, useState, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { apiFetch } from '../api/client.js'

Chart.register(...registerables)

export default function AIPredictionPage() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [predictions, setPredictions] = useState([])
  
  const chartCanvasBarsRef = useRef(null)
  const chartCanvasPieRef = useRef(null)
  const chartCanvasLineRef = useRef(null)
  const chartCanvasLeastRef = useRef(null)
  
  const chartsRef = useRef({})

  useEffect(() => {
    async function loadData() {
      try {
        const [purchasesData, productsData] = await Promise.all([
          apiFetch('/api/purchases'),
          apiFetch('/api/products')
        ])
        setPurchases(purchasesData.purchases || [])
        setProducts(productsData.products || [])
      } catch(e) {
        setMessage(e.message)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (purchases.length === 0 && products.length === 0) return

    const productStats = {}
    
    // Group purchases by product_id or name
    purchases.forEach(p => {
      const pid = p.product_id || p.item_name
      if (!productStats[pid]) {
        productStats[pid] = { totalQty: 0, items: [], name: p.item_name, productId: p.product_id }
      }
      productStats[pid].totalQty += Number(p.quantity)
      productStats[pid].items.push(p)
    })

    const newPredictions = []

    products.forEach(prod => {
        const stats = productStats[prod.id] || productStats[prod.name]
        
        let monthlyAvg = 0
        if (stats && stats.items.length > 0) {
            const months = new Set()
            stats.items.forEach(item => {
                if (item.purchase_date) {
                    months.add(item.purchase_date.substring(0, 7))
                }
            })
            const monthCount = Math.max(1, months.size)
            monthlyAvg = stats.totalQty / monthCount
        }

        const demand = monthlyAvg > 50 ? 'High' : (monthlyAvg >= 10 ? 'Medium' : 'Low')
        const demandClass = monthlyAvg > 50 ? 'demand-high' : (monthlyAvg >= 10 ? 'demand-medium' : 'demand-low')
        
        const predictedStockNextMonth = prod.quantity - monthlyAvg
        const threshold = prod.lowStockThreshold || 10
        const isLowStockPredicted = predictedStockNextMonth <= threshold

        if (isLowStockPredicted || prod.quantity <= threshold) {
            const reorderQty = Math.max(0, Math.ceil(monthlyAvg - prod.quantity + threshold))
            newPredictions.push({
                product: prod,
                monthlyAvg: monthlyAvg.toFixed(1),
                demand,
                demandClass,
                reorderQty
            })
        }
    })

    setPredictions(newPredictions)

    renderCharts(productStats, purchases)

    return () => {
        Object.values(chartsRef.current).forEach(c => c && c.destroy())
    }
  }, [purchases, products])

  function renderCharts(productStats, allPurchases) {
      Object.values(chartsRef.current).forEach(c => c && c.destroy())
      chartsRef.current = {}

      const sortedStats = Object.values(productStats).sort((a,b) => b.totalQty - a.totalQty)
      
      const top10 = sortedStats.slice(0, 10)
      const ctxTop = chartCanvasBarsRef.current?.getContext('2d')
      if (ctxTop) {
          chartsRef.current.top = new Chart(ctxTop, {
              type: 'bar',
              data: {
                  labels: top10.map(s => s.name),
                  datasets: [{
                      label: 'Total Purchased',
                      data: top10.map(s => s.totalQty),
                      backgroundColor: 'rgba(54, 162, 235, 0.6)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks:{ color:'#fff' } }, y: { ticks:{ color:'#fff' } } } }
          })
      }

      const least10 = sortedStats.slice(-10).reverse()
      const ctxLeast = chartCanvasLeastRef.current?.getContext('2d')
      if (ctxLeast) {
          chartsRef.current.least = new Chart(ctxLeast, {
              type: 'bar',
              data: {
                  labels: least10.map(s => s.name),
                  datasets: [{
                      label: 'Least Purchased Items',
                      data: least10.map(s => s.totalQty),
                      backgroundColor: 'rgba(255, 99, 132, 0.6)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks:{ color:'#fff' } }, y: { ticks:{ color:'#fff' } } } }
          })
      }

      const catCount = {}
      allPurchases.forEach(p => {
          const cat = p.category || 'Uncategorized'
          catCount[cat] = (catCount[cat] || 0) + Number(p.quantity)
      })

      const ctxPie = chartCanvasPieRef.current?.getContext('2d')
      if (ctxPie) {
          chartsRef.current.pie = new Chart(ctxPie, {
              type: 'pie',
              data: {
                  labels: Object.keys(catCount),
                  datasets: [{
                      data: Object.values(catCount),
                      backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0', '#9966ff']
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff', position: 'right' } } } }
          })
      }

      const months = {}
      allPurchases.forEach(p => {
          if (p.purchase_date) {
              const m = p.purchase_date.substring(0, 7)
              months[m] = (months[m] || 0) + Number(p.quantity)
          }
      })

      const sortedMonths = Object.keys(months).sort()
      const ctxLine = chartCanvasLineRef.current?.getContext('2d')
      if (ctxLine) {
          chartsRef.current.line = new Chart(ctxLine, {
              type: 'line',
              data: {
                  labels: sortedMonths,
                  datasets: [{
                      label: 'Monthly Purchases',
                      data: sortedMonths.map(m => months[m]),
                      borderColor: '#4bc0c0',
                      tension: 0.1,
                      fill: false
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks:{ color:'#fff' } }, y: { ticks:{ color:'#fff' } } } }
          })
      }
  }

  return (
    <div className="section" style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
        <h2>AI Prediction & Analytics</h2>
        {message && <div className="message">{message}</div>}

        <h3 style={{ marginTop: 24, marginBottom: 8 }}>Predicted Low Stock & Reorder Suggestions</h3>
        <p className="muted" style={{ margin: '0 0 20px 0' }}>Based on moving average of past purchases.</p>
        
        <div className="row" style={{ gap: 20 }}>
            {predictions.length > 0 ? predictions.map(p => (
                <div key={p.product.id} className="card" style={{ flex: '1 1 300px', minWidth: 300, borderLeft: '4px solid #f39c12' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>{p.product.name}</h4>
                    <div style={{ marginBottom: 8 }}>Current Stock: <strong>{p.product.quantity}</strong></div>
                    <div style={{ marginBottom: 8 }}>Est. Monthly Demand: <strong>{p.monthlyAvg}</strong></div>
                    <div style={{ marginBottom: 12 }}>
                        Demand Trend: <span className={`demand-pill ${p.demandClass}`}>{p.demand}</span>
                    </div>
                    <div>
                        <span className="badge-reorder">Suggest Reorder: +{p.reorderQty}</span>
                    </div>
                </div>
            )) : <div style={{ padding: 12 }}>No low stock predictions at this time.</div>}
        </div>

        <h3 style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>Purchase Analytics Dashboard</h3>
        
        <div className="row" style={{ marginTop: 20, gap: 24 }}>
            <div className="card" style={{ flex: '1 1 500px' }}>
                <h4>Most Purchased Items</h4>
                <div className="chart-container"><canvas ref={chartCanvasBarsRef} /></div>
            </div>
            <div className="card" style={{ flex: '1 1 500px' }}>
                <h4>Least Purchased Items</h4>
                <div className="chart-container"><canvas ref={chartCanvasLeastRef} /></div>
            </div>
        </div>
        
        <div className="row" style={{ marginTop: 24, gap: 24 }}>
            <div className="card" style={{ flex: '1 1 500px' }}>
                <h4>Category-wise Purchase Trends</h4>
                <div className="chart-container"><canvas ref={chartCanvasPieRef} /></div>
            </div>
            <div className="card" style={{ flex: '1 1 500px' }}>
                <h4>Monthly Purchase Timeline</h4>
                <div className="chart-container"><canvas ref={chartCanvasLineRef} /></div>
            </div>
        </div>

        <div style={{ height: 40 }} />
    </div>
  )
}
