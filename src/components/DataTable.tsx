import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Column {
  key: string
  label: string
  labelAr: string
  width?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  renderCell: (row: any, column: Column) => ReactNode
  emptyMessage?: string
  emptyMessageAr?: string
}

export default function DataTable({ columns, data, renderCell, emptyMessage, emptyMessageAr }: DataTableProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          {/* رأس الجدول - المحاذاة تلقائية حسب اللغة */}
          <thead>
            <tr className="bg-gray-50">
              {columns.map(column => (
                <th 
                  key={column.key}
                  className={`
                    py-4 px-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                  style={{ width: column.width }}
                >
                  {isRTL ? column.labelAr : column.label}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* جسم الجدول - المحاذاة تلقائية حسب اللغة */}
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  {isRTL ? emptyMessageAr : emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map(column => (
                    <td 
                      key={column.key}
                      className={`
                        py-3.5 px-4
                        ${isRTL ? 'text-right' : 'text-left'}
                      `}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}