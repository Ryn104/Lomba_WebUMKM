import {
  // Makanan berat
  Utensils, UtensilsCrossed, CookingPot, Soup, Beef, Drumstick, Fish, Egg, Salad, Wheat, ChefHat,
  // Jajanan & kue
  Cookie, Cake, Croissant, IceCream, Candy, Sandwich, Popcorn, Flame,
  // Minuman
  Coffee, CupSoda, Milk, Citrus,
  // Buah & sayur
  Apple, Banana, Grape, Carrot,
  // Fashion & jahit
  Shirt, Footprints, ShoppingBag, Backpack, Scissors, Gem, Glasses, Watch,
  // Kerajinan & souvenir
  Palette, Brush, Hammer, Gift, Sparkles,
  // Pertanian & peternakan
  Sprout, Leaf, Flower2, PawPrint, Bird,
  // Jasa
  WashingMachine, Wrench, Car, Bike, Truck, Smartphone, Printer, Camera, Gamepad2, Wifi, Zap, Fuel,
  // Toko & kebutuhan
  Store, ShoppingBasket, Tag, Package, Pill, Baby, Book, Pencil, Heart,
  // Musik
  Guitar, Drum, Music,
  // Kunci lama (tetap didukung agar data lama tidak rusak)
  Wine, Beer, Laptop, Tv, Mic, Headphones, Armchair, Sofa, BedDouble, Lamp, Briefcase, Lightbulb, Dumbbell,
} from 'lucide-react'

export const CATEGORY_ICON_MAP = {
  // Makanan berat
  utensils: Utensils, warung: UtensilsCrossed, pot: CookingPot, soup: Soup, beef: Beef,
  drumstick: Drumstick, fish: Fish, egg: Egg, salad: Salad, rice: Wheat, chef: ChefHat,

  // Jajanan & kue
  cookie: Cookie, cake: Cake, croissant: Croissant, icecream: IceCream, candy: Candy,
  sandwich: Sandwich, popcorn: Popcorn, flame: Flame,

  // Minuman
  coffee: Coffee, soda: CupSoda, milk: Milk, citrus: Citrus,

  // Buah & sayur
  apple: Apple, banana: Banana, grape: Grape, carrot: Carrot,

  // Fashion & jahit
  shirt: Shirt, shoe: Footprints, bag: ShoppingBag, backpack: Backpack,
  scissors: Scissors, gem: Gem, glasses: Glasses, watch: Watch,

  // Kerajinan & souvenir
  palette: Palette, brush: Brush, hammer: Hammer, gift: Gift, sparkles: Sparkles,

  // Pertanian & peternakan
  sprout: Sprout, leaf: Leaf, flower: Flower2, pet: PawPrint, bird: Bird,

  // Jasa
  laundry: WashingMachine, wrench: Wrench, car: Car, bike: Bike, truck: Truck,
  phone: Smartphone, printer: Printer, camera: Camera, gamepad: Gamepad2,
  wifi: Wifi, zap: Zap, fuel: Fuel,

  // Toko & kebutuhan
  store: Store, basket: ShoppingBasket, tag: Tag, package: Package, pill: Pill,
  baby: Baby, book: Book, pencil: Pencil, heart: Heart,

  // Musik
  guitar: Guitar, drum: Drum, music: Music,

  // Lainnya
  wine: Wine, beer: Beer, laptop: Laptop, tv: Tv, mic: Mic, headphones: Headphones,
  armchair: Armchair, sofa: Sofa, bed: BedDouble, lamp: Lamp, briefcase: Briefcase,
  lightbulb: Lightbulb, dumbbell: Dumbbell,
}

export const CATEGORY_ICON_GROUPS = [
  {
    label: 'Makanan Berat',
    keys: ['utensils', 'warung', 'pot', 'soup', 'beef', 'drumstick', 'fish', 'egg', 'salad', 'rice', 'chef'],
  },
  {
    label: 'Jajanan & Kue',
    keys: ['cookie', 'cake', 'croissant', 'icecream', 'candy', 'sandwich', 'popcorn', 'flame'],
  },
  {
    label: 'Minuman',
    keys: ['coffee', 'soda', 'milk', 'citrus'],
  },
  {
    label: 'Buah & Sayur',
    keys: ['apple', 'banana', 'grape', 'carrot'],
  },
  {
    label: 'Fashion & Jahit',
    keys: ['shirt', 'shoe', 'bag', 'backpack', 'scissors', 'gem', 'glasses', 'watch'],
  },
  {
    label: 'Kerajinan & Souvenir',
    keys: ['palette', 'brush', 'hammer', 'gift', 'sparkles'],
  },
  {
    label: 'Pertanian & Peternakan',
    keys: ['sprout', 'leaf', 'flower', 'pet', 'bird'],
  },
  {
    label: 'Jasa & Layanan',
    keys: ['laundry', 'wrench', 'car', 'bike', 'truck', 'phone', 'printer', 'camera', 'gamepad', 'wifi', 'zap', 'fuel'],
  },
  {
    label: 'Toko & Kebutuhan',
    keys: ['store', 'basket', 'tag', 'package', 'pill', 'baby', 'book', 'pencil', 'heart'],
  },
  {
    label: 'Musik',
    keys: ['guitar', 'drum', 'music'],
  },
  {
    label: 'Lainnya',
    keys: ['wine', 'beer', 'laptop', 'tv', 'mic', 'headphones', 'armchair', 'sofa', 'bed', 'lamp', 'briefcase', 'lightbulb', 'dumbbell'],
  },
]

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICON_MAP)