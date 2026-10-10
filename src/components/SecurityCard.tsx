import { ReactNode } from 'react';
export default function SecurityCard({title,status,description,icon}:{title:string;status:string;description:string;icon?:ReactNode}){return <div className="card security-card"><div className="stat-top"><span className="stat-icon green">{icon}</span><span className="security-status">{status}</span></div><h3>{title}</h3><p>{description}</p></div>}
