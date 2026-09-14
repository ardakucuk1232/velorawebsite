export const products = [
  {
    id: 'daily-greens',
    name: 'Daily Greens',
    category: 'Günlük yaşam',
    tag: 'GÜNLÜK RİTÜEL',
    size: '30 porsiyon · 150 g',
    price: 890,
    image: '/images/daily-greens.webp',
    description:
      'Elma, ıspanak ve nane notalarını bir araya getiren yeşil içecek karışımı. Günlük rutininize taze bir dokunuş.',
    ingredients: 'Elma tozu, ıspanak tozu, limon tozu, nane.',
    usage: 'Bir ölçeği 200 ml soğuk suyla karıştırın. Serin ve kuru yerde saklayın.',
  },
  {
    id: 'glow-serum',
    name: 'Glow Serum',
    category: 'Cilt bakımı',
    tag: 'BAKIM FAVORİSİ',
    size: 'Yüz bakım serumu · 30 ml',
    price: 690,
    image: '/images/glow-serum.webp',
    description:
      'Hafif dokulu, günlük yüz bakım serumu. Cilt bakım rutininizde yumuşak ve özenli bir adım.',
    ingredients: 'Aqua, Glycerin, Squalane, Sodium Hyaluronate.',
    usage:
      'Temiz cilde 2–3 damla uygulayın. Gözle temasından kaçının. İlk kullanım öncesi küçük bir alanda deneyin.',
  },
  {
    id: 'botanic-tea',
    name: 'Botanic Tea',
    category: 'Bitki çayları',
    tag: 'KÜÇÜK BİR MOLA',
    size: 'Bitki çayı · 80 g',
    price: 390,
    image: '/images/botanic-tea.webp',
    description:
      'Melisa, papatya ve limon otunun dengeli buluşması. Kendinize ayırdığınız sakin anlara eşlik eder.',
    ingredients: 'Melisa, papatya, limon otu.',
    usage: 'Bir çay kaşığını 200 ml sıcak suda 5–7 dakika demleyin.',
  },
  {
    id: 'pure-cleanse',
    name: 'Pure Cleanse',
    category: 'Cilt bakımı',
    tag: 'YENİ',
    size: 'Yüz temizleme jeli · 150 ml',
    price: 490,
    image: '/images/pure-cleanse.webp',
    description:
      'Günlük cilt bakımının ilk adımı. Hafif jel dokusuyla temizlik ritüeline eşlik eder.',
    ingredients: 'Aqua, Glycerin, Coco-Glucoside, Panthenol.',
    usage: 'Nemli cilde masajla uygulayın ve durulayın. Göz çevresinden kaçının.',
  },
  {
    id: 'silk-body',
    name: 'Silk Body',
    category: 'Vücut bakımı',
    tag: 'GÜNLÜK BAKIM',
    size: 'Vücut losyonu · 200 ml',
    price: 590,
    image: '/images/silk-body.webp',
    description:
      'Duş sonrası bakım için hafif dokulu vücut losyonu. Günlük rutininde kendine ayırdığın yumuşak bir an.',
    ingredients: 'Aqua, Glycerin, Butyrospermum Parkii Butter, Tocopherol.',
    usage: 'Temiz cilde dairesel hareketlerle uygulayın. Yalnızca harici kullanım içindir.',
  },
  {
    id: 'botanical-oil',
    name: 'Botanical Oil',
    category: 'Vücut bakımı',
    tag: 'BOTANİK DOKUNUŞ',
    size: 'Vücut bakım yağı · 100 ml',
    price: 750,
    image: '/images/botanical-oil.webp',
    description:
      'Özenli bir bakım ritüeli için bitkisel yağ karışımı. Hafif masajla uygulayabileceğin bir vücut bakım adımı.',
    ingredients: 'Prunus Amygdalus Dulcis Oil, Simmondsia Chinensis Seed Oil, Tocopherol.',
    usage: 'Az miktarda ürünü vücuda uygulayın. İlk kullanım öncesi küçük bir alanda deneyin.',
  },
  {
    id: 'soft-hands',
    name: 'Soft Hands',
    category: 'Vücut bakımı',
    tag: 'HER AN YANINDA',
    size: 'El bakım kremi · 75 ml',
    price: 290,
    image: '/images/soft-hands.webp',
    description:
      'Çantanda ve masanda yerini alacak günlük el bakım kremi. Hafif dokusuyla gün içindeki küçük bakım molan.',
    ingredients: 'Aqua, Glycerin, Butyrospermum Parkii Butter, Panthenol.',
    usage: 'Temiz ellere az miktarda uygulayın. Gerektikçe tekrarlayın.',
  },
  {
    id: 'morning-brew',
    name: 'Morning Brew',
    category: 'Kahve',
    tag: 'GÜNE GÜZEL BAŞLA',
    size: 'Öğütülmüş filtre kahve · 200 g',
    price: 450,
    image: '/images/morning-brew.webp',
    description:
      'Sabah ritüellerine eşlik eden, dengeli içimli orta kavrum filtre kahve. Kendine bir fincanlık zaman ayır.',
    ingredients: '%100 Arabica kahve.',
    usage:
      'Bir fincan için yaklaşık 12 g kahveyi filtre yöntemiyle demleyin. Açıldıktan sonra hava almayan kapta saklayın.',
  },
  {
    id: 'mineral-bath',
    name: 'Mineral Bath',
    category: 'Banyo ritüeli',
    tag: 'KENDİNE ZAMAN AYIR',
    size: 'Banyo tuzu · 300 g',
    price: 420,
    image: '/images/mineral-bath.webp',
    description:
      'Gün sonunda sana ait bir mola. Ilık banyo ritüeline ekleyebileceğin mineral tuz karışımı.',
    ingredients: 'Maris Sal, Magnesium Sulfate.',
    usage:
      'Ilık banyo suyuna az miktarda ekleyin. Yalnızca harici kullanım içindir; tahriş olmuş ciltte kullanmayın.',
  },
] as const;
export const money = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
export const statuses = [
  'Alındı',
  'Hazırlanıyor',
  'Kargoya verildi',
  'Teslim edildi',
  'İptal edildi',
];
export function statusChoices(current: string) {
  if (current === 'İptal edildi') return ['İptal edildi'];
  if (current === 'Teslim edildi') return ['Teslim edildi', 'İptal edildi'];
  if (current === 'Kargoya verildi') return ['Kargoya verildi', 'Teslim edildi', 'İptal edildi'];
  return statuses;
}
