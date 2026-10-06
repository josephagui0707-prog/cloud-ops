import { ReactNode } from 'react';
export default function CostCard({label,value,detail,icon}:{label:string;value:string;detail?:string;icon?:ReactNode}){return <div className="card cost-card"><div className="stat-top"><span className="stat-icon amber">{icon}</span></div><span className="stat-label">{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>}
