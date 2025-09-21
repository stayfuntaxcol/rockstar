export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme:{ extend:{
    colors:{
      bg:'#f6f7fb', card:'#ffffff', ink:'#0f172a',
      brand:'#0EA5A3', danger:'#ef4444', ok:'#10b981',
      muted:'#64748b', line:'#e5e7eb'
    },
    borderRadius:{ xl:'14px','2xl':'20px' },
    boxShadow:{ card:'0 10px 30px rgba(2,6,23,.06)', pop:'0 12px 40px rgba(2,6,23,.12)' }
  }},
  plugins:[require('@tailwindcss/forms'), require('@tailwindcss/typography')]
}
