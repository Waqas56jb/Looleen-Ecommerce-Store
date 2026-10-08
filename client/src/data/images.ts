/**
 * Centralized image library. Every image in the app comes from here.
 * Sources: Unsplash (free license), curated per category so each image
 * matches its context. Swap ids here to change imagery site-wide.
 */

const BASE = 'https://images.unsplash.com/'

/** Build a sized, cropped, auto-format Unsplash URL */
export function img(id: string, w = 800, h?: number): string {
  const size = h ? `&h=${h}&fit=crop&crop=entropy` : ''
  return `${BASE}${id}?auto=format&q=75&w=${w}${size}`
}

export const IMAGE_POOL = {
  serum: [
    'photo-1713768704571-6aeb0d0e5105',
    'photo-1710410815589-dd83514104d0',
    'photo-1679394270597-e90694d70350',
    'photo-1715750968540-841103c78d47',
    'photo-1715027155125-810cb995203f',
    'photo-1770732766528-d0e9fd0df233',
    'photo-1696256016872-1526c9d0e280',
    'photo-1671493235081-5842463637cd'
  ],
  cream: [
    'photo-1763503839418-2b45c3d7a3c3',
    'photo-1763503836825-97f5450d155a',
    'photo-1786171128252-716f3915293d',
    'photo-1765964492963-b0aa8c172431',
    'photo-1763503834047-ac85c4105c0b',
    'photo-1772191530787-b9546da02fbc',
    'photo-1764694071508-e4b1efcd39bc',
    'photo-1785581778868-79100f7fe56c'
  ],
  cleanser: [
    'photo-1748639320154-6ba118bccc74',
    'photo-1745141063798-7fa04698ea80',
    'photo-1739131285874-8d545cffef95',
    'photo-1745138806610-cfbd14b3d18f',
    'photo-1746227638992-50b1e1e0d96b',
    'photo-1732861612232-50cbe19c1ae5',
    'photo-1755344339841-d34979cbfd10'
  ],
  sunscreen: [
    'photo-1623676714504-edd78728155e',
    'photo-1594055103006-7871176f1a7e',
    'photo-1594527964562-32ed6eb11709',
    'photo-1686831451322-8d8e234a51e1',
    'photo-1698912198250-fb0c5ecccc6e'
  ],
  skinset: [
    'photo-1580870069867-74c57ee1bb07',
    'photo-1608571423902-eed4a5ad8108',
    'photo-1620916297397-a4a5402a3c6c',
    'photo-1552046122-03184de85e08',
    'photo-1583209814683-c023dd293cc6',
    'photo-1598440947619-2c35fc9aa908'
  ],
  shampoo: [
    'photo-1701992678972-d5a053ad0fb0',
    'photo-1747858989102-cca0f4dc4a11',
    'photo-1747098393451-6b985f62a2c2',
    'photo-1701992678962-41703126549c',
    'photo-1602143407151-7111542de6e8',
    'photo-1585232350744-974fc9804d65'
  ],
  hairoil: [
    'photo-1515377905703-c4788e51af15',
    'photo-1608571423539-e951b9b3871e',
    'photo-1699373381616-6133334e754e',
    'photo-1699373383910-6f9cf75ee50a',
    'photo-1699373381578-2663708d7f02'
  ],
  haircare: [
    'photo-1631729371254-42c2892f0e6e',
    'photo-1535585209827-a15fcdbc4c2d',
    'photo-1624939461078-66a124b3539c',
    'photo-1610705267928-1b9f2fa7f1c5',
    'photo-1747858989102-cca0f4dc4a11'
  ],
  bodylotion: [
    'photo-1620916566398-39f1143ab7be',
    'photo-1619451427882-6aaaded0cc61',
    'photo-1498843053639-170ff2122f35',
    'photo-1629732047847-50219e9c5aef',
    'photo-1556227834-09f1de7a7d14',
    'photo-1629732097571-b042b35aa3ed',
    'photo-1748543668676-ea8241cb3886'
  ],
  men: [
    'photo-1775126455263-ed926ab25fa4',
    'photo-1621605810052-80936545a850',
    'photo-1785144983613-c787001e6866',
    'photo-1646376241249-f261e72c2029'
  ],
  baby: [
    'photo-1750085036915-6e21c6981586'
  ],
  foundation: [
    'photo-1512496015851-a90fb38ba796',
    'photo-1643185450492-6ba77dea00f6',
    'photo-1531646317777-0619c7c5d1d3',
    'photo-1701271482230-5ecaec3cd3e1',
    'photo-1557205465-f3762edea6d3',
    'photo-1764333746348-1df13b3a4aae'
  ],
  lipstick: [
    'photo-1631214499500-2e34edcaccfe',
    'photo-1625093742435-6fa192b6fb10',
    'photo-1626895872564-b691b6877b83',
    'photo-1586495777744-4413f21062fa',
    'photo-1619352520578-8fefbfa2f904',
    'photo-1542452255191-c85a98f2c5d1',
    'photo-1555050455-f96634b5cba6',
    'photo-1571646034647-52e6ea84b28c',
    'photo-1617422275558-e5f616302690'
  ],
  mascara: [
    'photo-1512207159096-c2c91b1dfadd',
    'photo-1670832209136-fad04d9920f9',
    'photo-1706170498499-235824fd317c',
    'photo-1548902378-2ec44c906391'
  ],
  eyeshadow: [
    'photo-1547934659-7fa699ef3ce0',
    'photo-1533562389935-457b1ae48a39',
    'photo-1583931537180-7d26921260e4',
    'photo-1768983224486-b4dcd179b4a5',
    'photo-1548954638-082b560e0a66',
    'photo-1533562530973-424ab36f1448',
    'photo-1625094640367-05f84293fe42'
  ],
  brows: [
    'photo-1709477542170-f11ee7d471a0',
    'photo-1638959882708-9503b1cd595f',
    'photo-1587910234573-d6fc84743bc8',
    'photo-1550005869-5fca7db35ddb'
  ],
  nails: [
    'photo-1619607146034-5a05296c8f9a',
    'photo-1723647395168-d916159b78c9',
    'photo-1602585578130-c9076e09330d',
    'photo-1610992015762-45dca7fa3a85',
    'photo-1612887390768-fb02affea7a6',
    'photo-1604902396830-aca29e19b067'
  ],
  lenses: [
    'photo-1494869042583-f6c911f04b4c',
    'photo-1591571285398-5336622cff10',
    'photo-1534627425233-f7d6335ca734',
    'photo-1611631645709-69a8c5f41358',
    'photo-1764773963869-55a63732a19e',
    'photo-1764773963911-01313b5b4002',
    'photo-1585744136511-a0c6c473e8c6'
  ],
  blush: [
    'photo-1560130055-e3306e04884b',
    'photo-1503236823255-94609f598e71',
    'photo-1716287384717-972e03bf4179',
    'photo-1602558618194-3037081afe0d'
  ],
  perfume: [
    'photo-1541643600914-78b084683601',
    'photo-1458538977777-0549b2370168',
    'photo-1615634260167-c8cdede054de',
    'photo-1543422655-ac1c6ca993ed',
    'photo-1595425959632-34f2822322ce',
    'photo-1593487568720-92097fb460fb',
    'photo-1622618991746-fe6004db3a47',
    'photo-1594035910387-fea47794261f',
    'photo-1585218334450-afcf929da36e'
  ],
  mensperfume: [
    'photo-1621814374283-57cc5d0d39c2',
    'photo-1598634222670-87c5f558119c',
    'photo-1553699357-fdefb876c402',
    'photo-1583545889266-55be2d76c6c5',
    'photo-1644958307902-2d0347086a38',
    'photo-1644958292401-c095b23440b7',
    'photo-1763631403216-8d193008481e'
  ],
  unisexperfume: [
    'photo-1557170334-a9632e77c6e4',
    'photo-1566977776052-6e61e35bf9be',
    'photo-1590736704728-f4730bb30770',
    'photo-1672848700906-2b8ca62639e4',
    'photo-1458538977777-0549b2370168'
  ],
  facialdevice: [
    'photo-1578747763484-51b21a33e4fa',
    'photo-1600428853876-fb5a850b444f'
  ],
  hairdryer: [
    'photo-1727364438136-6edc10ef0a52',
    'photo-1522338140262-f46f5913618a',
    'photo-1522336284037-91f7da073525',
    'photo-1715220169023-c1d5c8d2be37'
  ],
  styling: [
    'photo-1779398341989-b783e687cd7e'
  ],
  curler: [
    'photo-1560869713-7d0a29430803'
  ],
  salonhair: [
    'photo-1595475884562-073c30d45670',
    'photo-1596362601603-b74f6ef166e4'
  ],
  nailsalon: [
    'photo-1619607146034-5a05296c8f9a',
    'photo-1632345031435-8727f6897d53',
    'photo-1589710751893-f9a6770ad71b'
  ],
  tools: [
    'photo-1621605815971-fbc98d665033',
    'photo-1596362601603-b74f6ef166e4',
    'photo-1549271568-e87e07c5406b',
    'photo-1678356163587-6bb3afb89679',
    'photo-1675599193741-e6f078a65fbd'
  ],
  brushes: [
    'photo-1516975080664-ed2fc6a32937',
    'photo-1678695692040-e9a39502c357',
    'photo-1556262965-917187357da4',
    'photo-1596462502278-27bfdc403348',
    'photo-1620464003286-a5b0d79f32c2'
  ],
  disposable: [
    'photo-1684248655527-46bee8e79029'
  ],
  skinmodel: [
    'photo-1655026392641-bf283a5f12d4',
    'photo-1570172619644-dfd03ed5d881',
    'photo-1728727217834-b190862837a3',
    'photo-1761718209708-9ab9ba1c7252',
    'photo-1670201203208-055d6d79db4a',
    'photo-1648203276014-20f97ba1f817',
    'photo-1728727267814-792db55ce678',
    'photo-1693004927824-f2623bbedc8b'
  ],
  editorial: [
    'photo-1648249969490-44f3052a3721',
    'photo-1675773051474-55c4b7d2cf53',
    'photo-1624819581070-7868475f038c',
    'photo-1648922798217-f5d339cb7aa6',
    'photo-1631606927613-a4266317404c',
    'photo-1657928198258-1db7e50e2fd9'
  ],
  arab: [
    'photo-1743440724828-e42a2b4cc9f8',
    'photo-1622281631389-59e63d92760d',
    'photo-1584339312444-6952d098e152',
    'photo-1638433838471-ffdb9d8cb3ee'
  ],
  salon: [
    'photo-1634449571010-02389ed0f9b0',
    'photo-1580618672591-eb180b1a973f',
    'photo-1734111719430-fe4a3973f8af',
    'photo-1600948836101-f9ffda59d250',
    'photo-1700760934268-8aa0ef52ce0a',
    'photo-1536520002442-39764a41e987',
    'photo-1629397685944-7073f5589754',
    'photo-1521590832167-7bcbfaa6381f'
  ],
  hairsalonimg: [
    'photo-1580618672591-eb180b1a973f',
    'photo-1600948836101-f9ffda59d250',
    'photo-1633681926022-84c23e8cb2d6',
    'photo-1595475884562-073c30d45670',
    'photo-1521590832167-7bcbfaa6381f'
  ],
  spa: [
    'photo-1620733723572-11c53f73a416',
    'photo-1570172619644-dfd03ed5d881',
    'photo-1600334089648-b0d9d3028eb2'
  ],
  flatlay: [
    'photo-1608979048467-6194dabc6a3d',
    'photo-1512207841927-e233f469a877',
    'photo-1512496015851-a90fb38ba796',
    'photo-1522338242992-e1a54906a8da',
    'photo-1511923199659-1c16881689de',
    'photo-1598528738936-c50861cc75a9',
    'photo-1522335789203-aabd1fc54bc9'
  ],
  hairmodel: [
    'photo-1747398690600-ffe8ecda9df1'
  ],
  jade: [
    'photo-1598440947619-2c35fc9aa908'
  ]
} as const satisfies Record<string, readonly string[]>

export type ImagePoolKey = keyof typeof IMAGE_POOL

/** Deterministically pick an image id from a pool */
export function poolImage(key: ImagePoolKey, index = 0): string {
  const list = IMAGE_POOL[key]
  return list[((index % list.length) + list.length) % list.length]
}

/** Hand-picked editorial imagery for heroes, banners and sections */
export const EDITORIAL = {
  heroAuthentic: IMAGE_POOL.arab[0],
  heroDelivered: IMAGE_POOL.skinmodel[0],
  heroProfessional: IMAGE_POOL.salon[0],
  ritual: IMAGE_POOL.skinmodel[1],
  professional: IMAGE_POOL.hairsalonimg[1],
  newsletter: IMAGE_POOL.flatlay[0],
  about: IMAGE_POOL.flatlay[1],
  offers: IMAGE_POOL.editorial[0],
  bestSellers: IMAGE_POOL.flatlay[2],
  newArrivals: IMAGE_POOL.skinset[0],
  brands: IMAGE_POOL.perfume[0],
  contact: IMAGE_POOL.spa[0],
  auth: IMAGE_POOL.editorial[1],
  account: IMAGE_POOL.skinset[1],
  gallery: [IMAGE_POOL.arab[1], IMAGE_POOL.nailsalon[1], IMAGE_POOL.flatlay[3], IMAGE_POOL.perfume[2], IMAGE_POOL.salon[2], IMAGE_POOL.skinmodel[2]],
} as const

/** Local client logo (mockup photo supplied by the client) */
export const LOGO_PHOTO = '/logo.jpeg'
