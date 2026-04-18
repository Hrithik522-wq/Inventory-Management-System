import React, { useEffect, useState, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { apiFetch } from '../api/client.js'

Chart.register(...registerables)

export default function AdminAIView() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [predictions, setPredictions] = useState([])
  
  const chartCanvasBarsRef = useRef(null)
  const chartCanvasPieRef = useRef(null)
  const chartCanvasLineRef = useRef(null)
  
  const chartsRef = useRef({})

  useEffect(() => {
    async function loadData() {
      try {
        const [purchasesData, productsData] = await Promise.all([
          apiFetch('/api/admin/purchases'),
          apiFetch('/api/admin/products')
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
    purchases.forEach(p => {
      const pid = p.product_id || p.item_name
      if (!productStats[pid]) {
        productStats[pid] = { totalQty: 0, items: [], name: p.item_name }
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
                if (item.purchase_date) months.add(item.purchase_date.substring(0, 7))
            })
            monthlyAvg = stats.totalQty / Math.max(1, months.size)
        }

        const demand = monthlyAvg > 50 ? 'High' : (monthlyAvg >= 10 ? 'Medium' : 'Low')
        const demandClass = monthlyAvg > 50 ? 'demand-high' : (monthlyAvg >= 10 ? 'demand-medium' : 'demand-low')
        
        if (prod.quantity <= (prod.lowStockThreshold || 10)) {
            newPredictions.push({
                product: prod,
                monthlyAvg: monthlyAvg.toFixed(1),
                demand,
                demandClass
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

      const sortedStats = Object.values(productStats).sort((a,b) => b.totalQty - a.totalQty).slice(0, 8)
      const ctxTop = chartCanvasBarsRef.current?.getContext('2d')
      if (ctxTop) {
          chartsRef.current.top = new Chart(ctxTop, {
              type: 'bar',
              data: {
                  labels: sortedStats.map(s => s.name),
                  datasets: [{
                      label: 'System-wide Volume',
                      data: sortedStats.map(s => s.totalQty),
                      backgroundColor: 'rgba(54, 162, 235, 0.6)',
                      borderColor: 'rgba(54, 162, 235, 1)',
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
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } } }
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
                      label: 'Total Platform Sales',
                      data: sortedMonths.map(m => months[m]),
                      borderColor: '#4bc0c0',
                      tension: 0.1
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks:{ color:'#fff' } }, y: { ticks:{ color:'#fff' } } } }
          })
      }
  }

  return (
    <div style={{ marginTop: 14 }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Network-wide AI Predicitons</h3>
        {message && <div className="message">{message}</div>}

        <div className="row" style={{ gap: 14 }}>
            {predictions.length > 0 ? predictions.slice(0, 3).map(p => (
                <div key={p.product.id+''+p.product.userId} className="card" style={{ flex: 1, padding: 12, borderLeft: '3px solid #f39c12' }}>
                    <div style={{ fontSize: '0.8em', opacity: 0.7 }}>User #{p.product.userId}</div>
                    <div style={{ fontWeight: 800 }}>{p.product.name}</div>
                    <div style={{ fontSize: '0.9em' }}>Demand: <span className={p.demandClass}>{p.demand}</span></div>
                </div>
            )) : <div className="muted" style={{ padding: 10 }}>No critical predictions generated.</div>}
        </div>

        <div className="row" style={{ marginTop: 20, gap: 14 }}>
            <div className="card" style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Overall Volume</h4>
                <div style={{ height: 200 }}><canvas ref={chartCanvasBarsRef} /></div>
            </div>
            <div className="card" style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Market Share</h4>
                <div style={{ height: 200 }}><canvas ref={chartCanvasPieRef} /></div>
            </div>
            <div className="card" style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Growth Curve</h4>
                <div style={{ height: 200 }}><canvas ref={chartCanvasLineRef} /></div>
            </div>
        </div>
    </div>
  )
}
