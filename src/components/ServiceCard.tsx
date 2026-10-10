import { ReactNode } from 'react';
export default function ServiceCard({name,category,description,icon}:{name:string;category:string;description:string;icon?:ReactNode}){return <div className="card service-card"><div className="service-icon">{icon}</div><div><span className="section-kicker">{category}</span><h3>{name}</h3><p>{description}</p></div></div>}
