interface PageHeaderProps {
  title: React.ReactNode
  actions?: React.ReactNode
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
