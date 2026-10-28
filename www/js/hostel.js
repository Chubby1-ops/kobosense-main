function duties(){const d=["Sweep / mop","Waste run","Water / shared area"],n=["You",...state.roommates];return d.map((x,i)=>({duty:x,name:n[(i+state.dutyOffset)%n.length]}))}
