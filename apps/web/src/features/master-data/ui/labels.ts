/**
 * Owner guidance (2026-07-29): agents may choose clear Azerbaijani UI labels
 * for known delivered enums without stopping the task for confirmation.
 */
export const MASTER_DATA_LABELS = {
  currencies: {
    nav: 'Valyutalar',
    title: 'Valyutalar',
    create: 'Yeni valyuta',
    edit: 'Valyutanı redaktə et',
    empty: 'Heç bir valyuta tapılmadı.',
    deactivateConfirm: 'Bu valyutanı deaktiv etmək istəyirsiniz?',
  },
  units: {
    nav: 'Ölçü vahidləri',
    title: 'Ölçü vahidləri',
    create: 'Yeni ölçü vahidi',
    edit: 'Ölçü vahidini redaktə et',
    empty: 'Heç bir ölçü vahidi tapılmadı.',
    deactivateConfirm: 'Bu ölçü vahidini deaktiv etmək istəyirsiniz?',
  },
  products: {
    nav: 'Məhsullar',
    title: 'Məhsullar',
    create: 'Yeni məhsul',
    edit: 'Məhsulu redaktə et',
    empty: 'Heç bir məhsul tapılmadı.',
    deactivateConfirm: 'Bu məhsulu deaktiv etmək istəyirsiniz?',
    type: 'Tip',
    category: 'Kateqoriya',
    unit: 'Ölçü vahidi',
    standardSalePrice: 'Standart satış qiyməti',
    latestPurchasePrice: 'Son alış qiyməti',
    criticalStockThreshold: 'Kritik stok həddi',
    filterType: 'Tip filtri',
    codeReadonlyHint: 'Kod sistem tərəfindən yaradılır və dəyişdirilə bilməz.',
    types: {
      FINISHED_GOOD: 'Hazır məhsul',
      RAW_MATERIAL: 'Xammal',
      MIXED_USE: 'Qarışıq təyinatlı',
    },
  },
  partners: {
    nav: 'Biznes tərəfdaşları',
    title: 'Biznes tərəfdaşları',
    create: 'Yeni tərəfdaş',
    edit: 'Tərəfdaşı redaktə et',
    empty: 'Heç bir tərəfdaş tapılmadı.',
    deactivateConfirm: 'Bu tərəfdaşı deaktiv etmək istəyirsiniz?',
    role: 'Rol',
    customer: 'Müştəri',
    supplier: 'Təchizatçı',
    bothRoles: 'Hər ikisi',
    filterRole: 'Rol filtri',
    defaultCurrency: 'Defolt valyuta',
    phone: 'Telefon',
    email: 'E-poçt',
    taxNumber: 'Vergi nömrəsi',
    address: 'Ünvan',
    notes: 'Qeydlər',
    codeReadonlyHint: 'Kod sistem tərəfindən yaradılır və dəyişdirilə bilməz.',
    duplicateTitle: 'Oxşar tərəfdaşlar tapıldı',
    duplicateIntro:
      'Eyni ad, telefon və ya vergi nömrəsinə oxşayan mövcud qeydlər var. Davam etmək üçün açıq şəkildə təsdiqləyin.',
    duplicateAcknowledge: 'Buna baxmayaraq yadda saxla',
    matchedFields: 'Uyğun sahələr',
    matched: {
      name: 'Ad',
      phone: 'Telefon',
      taxNumber: 'Vergi nömrəsi',
    },
  },
  common: {
    code: 'Kod',
    name: 'Ad',
    symbol: 'Simvol',
    status: 'Status',
    active: 'Aktiv',
    inactive: 'Deaktiv',
    search: 'Axtarış',
    filterStatus: 'Status filtri',
    all: 'Hamısı',
    actions: 'Əməliyyatlar',
    edit: 'Redaktə et',
    deactivate: 'Deaktiv et',
    save: 'Yadda saxla',
    cancel: 'Ləğv et',
    createSuccess: 'Qeyd yaradıldı.',
    updateSuccess: 'Qeyd yeniləndi.',
    deactivateSuccess: 'Qeyd deaktiv edildi.',
    loading: 'Yüklənir…',
    loadError: 'Məlumatlar yüklənmədi.',
    retry: 'Yenidən cəhd et',
    fractional: 'Fraksiyalı miqdar icazəsi',
    yes: 'Bəli',
    no: 'Xeyr',
    confirm: 'Təsdiq et',
  },
} as const;

export type ProductTypeLabelKey =
  keyof typeof MASTER_DATA_LABELS.products.types;

export function productTypeLabel(type: ProductTypeLabelKey): string {
  return MASTER_DATA_LABELS.products.types[type];
}
