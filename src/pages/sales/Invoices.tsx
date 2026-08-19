import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Search, Eye, Download, Printer, Banknote, CreditCard, Wallet, Coffee, Phone, Mail, MapPin, FileText } from 'lucide-react'

const paymentMethodIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  wallet: Wallet,
}

export default function Invoices() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { invoices, settings } = useStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  const filteredInvoices = invoices.filter(inv =>
    inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedInvoiceData = invoices.find(inv => inv.id === selectedInvoice)

  // ============ طباعة الفاتورة ============
  const printInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const shopName = isRTL ? settings.shopNameAr : settings.shopName
    const currency = isRTL ? settings.currencyAr : settings.currency
    const footer = isRTL ? settings.receiptFooterAr : settings.receiptFooter
    const logo = settings.logo

    const itemsRows = invoice.items.map((item: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${isRTL ? item.nameAr : item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.price.toFixed(3)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toFixed(3)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoice.number}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; background: #fff; }
            .invoice-header { text-align: center; border-bottom:2px solid #f59e0b; padding-bottom:15px; margin-bottom:15px; }
            .invoice-logo { width:80px; height:80px; border-radius:8px; object-fit:cover; margin:0 auto 10px; display:block; }
            .invoice-title { font-size:22px; font-weight:bold; color:#1e293b; }
            .shop-details { font-size:12px; color:#555; margin-top:8px; line-height:1.6; }
            .invoice-number { font-size:16px; font-weight:bold; color:#f59e0b; margin-top:8px; }
            .invoice-date { font-size:12px; color:#555; margin-top:4px; }
            table { width:100%; border-collapse:collapse; margin-bottom:15px; }
            .summary { border-top:2px dashed #ddd; padding-top:10px; }
            .summary-row { display:flex; justify-content:space-between; margin-bottom:5px; font-size:14px; }
            .summary-total { display:flex; justify-content:space-between; margin-top:8px; padding-top:8px; border-top:1px solid #ddd; font-weight:bold; font-size:16px; }
            .footer { text-align:center; color:#888; font-size:12px; margin-top:20px; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            ${logo ? `<img src="${logo}" alt="Logo" class="invoice-logo" />` : '<div class="invoice-logo" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:35px;">☕</div>'}
            <div class="invoice-title">${shopName}</div>
            <div class="shop-details">
              ${settings.address ? `<div>${settings.address}</div>` : ''}
              ${settings.phone ? `<div>${settings.phone}</div>` : ''}
              ${settings.email ? `<div>${settings.email}</div>` : ''}
              ${settings.commercialRegister ? `<div>${isRTL ? 'س.ت:' : 'CR:'} ${settings.commercialRegister}</div>` : ''}
            </div>
            <div class="invoice-number">${invoice.number}</div>
            <div class="invoice-date">${new Date(invoice.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</div>
            <div class="invoice-date">${isRTL ? 'فاتورة ضريبية' : 'Tax Invoice'}</div>
          </div>

          <div style="margin-bottom:10px; font-size:13px;">
            <div><strong>${isRTL ? 'العميل' : 'Customer'}:</strong> ${invoice.customerName}</div>
            <div style="color:#555; font-size:12px;">${isRTL ? 'رقم الطلب' : 'Order #'}: ${invoice.orderNumber}</div>
          </div>

          <table>
            <thead>
              <tr style="border-bottom:2px solid #e2e8f0; background:#f8fafc;">
                <th style="text-align:${isRTL ? 'right' : 'left'};padding:8px;">${isRTL ? 'العنصر' : 'Item'}</th>
                <th style="text-align:center;padding:8px;">${isRTL ? 'الكمية' : 'Qty'}</th>
                <th style="text-align:center;padding:8px;">${isRTL ? 'السعر' : 'Price'}</th>
                <th style="text-align:${isRTL ? 'left' : 'right'};padding:8px;">${isRTL ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>${isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>${invoice.subtotal.toFixed(3)} ${currency}</span>
            </div>
            ${invoice.discount > 0 ? `
            <div class="summary-row" style="color:#e11d48;">
              <span>${isRTL ? 'الخصم' : 'Discount'}</span>
              <span>-${invoice.discount.toFixed(3)}</span>
            </div>` : ''}
            <div class="summary-row">
              <span>${isRTL ? 'الضريبة' : 'Tax'}</span>
              <span>${invoice.tax.toFixed(3)}</span>
            </div>
            <div class="summary-total">
              <span>${isRTL ? 'الإجمالي النهائي' : 'Total'}</span>
              <span style="color:#f59e0b;">${invoice.total.toFixed(3)} ${currency}</span>
            </div>
          </div>

          <div class="footer">${footer}</div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const columns = [
    { key: 'number', label: 'Invoice #', labelAr: 'رقم الفاتورة' },
    { key: 'order', label: 'Order #', labelAr: 'رقم الطلب' },
    { key: 'customer', label: 'Customer', labelAr: 'العميل' },
    { key: 'total', label: 'Total', labelAr: 'الإجمالي' },
    { key: 'payment', label: 'Payment', labelAr: 'الدفع' },
    { key: 'date', label: 'Date', labelAr: 'التاريخ' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (inv: any, column: any) => {
    switch (column.key) {
      case 'number':
        return <span className="font-semibold text-sm">{inv.number}</span>
      case 'order':
        return <span className="text-sm text-gray-600">{inv.orderNumber}</span>
      case 'customer':
        return <span className="text-sm">{inv.customerName}</span>
      case 'total':
        return <span className="font-bold text-accent">{inv.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
      case 'payment': {
        const PaymentIcon = paymentMethodIcons[inv.paymentMethod] || Banknote
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <PaymentIcon className="w-4 h-4 text-gray-400" />
            {inv.paymentMethod === 'cash' ? (isRTL ? 'كاش' : 'Cash') : inv.paymentMethod === 'card' ? (isRTL ? 'شبكة' : 'Card') : (isRTL ? 'محفظة' : 'Wallet')}
          </span>
        )
      }
      case 'date':
        return <span className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => setSelectedInvoice(inv.id)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => printInvoice(inv)} className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الفواتير' : 'Invoices'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'جميع الفواتير الصادرة' : 'All issued invoices'}</p>
        </div>
        <button 
          onClick={() => {
            const headers = ['Invoice #', 'Order #', 'Customer', 'Total', 'Date']
            const rows = filteredInvoices.map(inv => [inv.number, inv.orderNumber, inv.customerName, inv.total.toString(), inv.createdAt])
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'invoices.csv'
            link.click()
          }}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 text-sm"
        >
          <Download className="w-4 h-4" />
          {isRTL ? 'تصدير' : 'Export'}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl bg-white outline-none text-sm`}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        renderCell={renderCell}
        emptyMessage="No invoices found"
        emptyMessageAr="لا توجد فواتير"
      />

      {/* نافذة عرض الفاتورة */}
      {selectedInvoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dashed text-center">
              <div className="flex flex-col items-center">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover mb-3" />
                ) : (
                  <Coffee className="w-14 h-14 text-accent mb-3" />
                )}
                <h2 className="text-xl font-bold">{isRTL ? settings.shopNameAr : settings.shopName}</h2>
                <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                  {settings.address && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {settings.address}</p>}
                  {settings.phone && <p className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" /> {settings.phone}</p>}
                  {settings.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {settings.email}</p>}
                  {settings.commercialRegister && (
                    <p className="flex items-center gap-1"><FileText className="w-3 h-3" /> {isRTL ? 'س.ت:' : 'CR:'} {settings.commercialRegister}</p>
                  )}
                </div>
                <h3 className="text-lg font-bold text-accent mt-3">{selectedInvoiceData.number}</h3>
                <p className="text-xs text-gray-500">{new Date(selectedInvoiceData.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</p>
                <p className="text-xs text-gray-500">{isRTL ? 'فاتورة ضريبية' : 'Tax Invoice'}</p>
              </div>
            </div>

            <div className="px-6 py-4 border-b">
              <p className="text-sm font-semibold">{isRTL ? 'العميل' : 'Customer'}: {selectedInvoiceData.customerName}</p>
              <p className="text-sm text-gray-500">{isRTL ? 'رقم الطلب' : 'Order #'}: {selectedInvoiceData.orderNumber}</p>
            </div>

            <div className="px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-right">{isRTL ? 'العنصر' : 'Item'}</th>
                    <th className="py-2 text-center">{isRTL ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2 text-center">{isRTL ? 'السعر' : 'Price'}</th>
                    <th className="py-2 text-left">{isRTL ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceData.items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2">{isRTL ? item.nameAr : item.name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-center">{item.price.toFixed(3)}</td>
                      <td className="py-2 text-left">{(item.price * item.quantity).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-dashed space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{selectedInvoiceData.subtotal.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
              </div>
              {selectedInvoiceData.discount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                  <span>-{selectedInvoiceData.discount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'الضريبة' : 'Tax'}</span>
                <span>{selectedInvoiceData.tax.toFixed(3)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>{isRTL ? 'الإجمالي النهائي' : 'Total'}</span>
                <span className="text-accent">{selectedInvoiceData.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
              </div>
            </div>

            <div className="px-6 py-4 text-center text-xs text-gray-400 border-t">
              {isRTL ? settings.receiptFooterAr : settings.receiptFooter}
            </div>

            <div className="p-4 border-t flex gap-2">
              <button 
                onClick={() => printInvoice(selectedInvoiceData)} 
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
              </button>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}