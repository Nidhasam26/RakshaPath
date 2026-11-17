import { ArrowUpRight, Shield } from 'lucide-react'

function PageHeader({ eyebrow = 'Your safe journey', title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow"><Shield size={13} />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardTitle({ title, detail, action }) {
  return <div className="panel-head"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action || <ArrowUpRight size={16} color="#6d7a83" />}</div>
}

export default PageHeader
