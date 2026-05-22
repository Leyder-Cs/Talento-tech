import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hgw.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin creado: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin ya existe: ${adminEmail}`);
  }

  const categoriesData = [
    { name: 'Suplementos', slug: 'suplementos', imageUrl: '' },
    { name: 'Tés', slug: 'tes', imageUrl: '' },
    { name: 'Aceites', slug: 'aceites', imageUrl: '' },
    { name: 'Proteínas', slug: 'proteinas', imageUrl: '' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (existing) {
      categories[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({ data: cat });
      categories[cat.name] = created.id;
      console.log(`✅ Categoría creada: ${cat.name}`);
    }
  }

  const productsData = [
    {
      name: 'Moringa Premium 500g',
      slug: 'moringa-premium-500g',
      shortDescription:
        'Moringa orgánica en polvo, rica en vitaminas y minerales esenciales.',
      description:
        'La Moringa Premium HGW es un superalimento natural cultivado sin pesticidas. Contiene más de 90 nutrientes, 46 antioxidantes y 36 antiinflamatorios. Ideal para fortalecer el sistema inmunológico, aumentar la energía y mejorar la digestión. Cada envase de 500g rinde aproximadamente 60 porciones.',
      price: 45000,
      stock: 50,
      benefits:
        'Fortalece el sistema inmune, aumenta la energía natural, mejora la digestión, rica en antioxidantes, apoya la salud ósea.',
      ingredients:
        '100% hojas de Moringa oleifera en polvo finamente molidas. Sin aditivos, conservantes ni colorantes artificiales.',
      usageInstructions:
        'Consumir 1 cucharada (8g) al día mezclada en agua, jugo, smoothie o comida. Puede dividirse en dos tomas. No exceder la dosis recomendada.',
      contraindications:
        'Mujeres embarazadas o en lactancia consultar con su médico. Personas con problemas de tiroides deben moderar su consumo.',
      featured: true,
      categoryName: 'Suplementos',
    },
    {
      name: 'Té Verde Matcha Orgánico',
      slug: 'te-verde-matcha-organico',
      shortDescription:
        'Matcha ceremonial japonés de alta calidad, rico en antioxidantes.',
      description:
        'Nuestro Té Verde Matcha Orgánico proviene de plantaciones certificadas en Japón. Las hojas se cultivan a la sombra para aumentar su contenido de clorofila y L-teanina, luego se muelen en molino de piedra hasta obtener un polvo ultrafino. Proporciona energía sostenida sin nerviosismo.',
      price: 38000,
      stock: 30,
      benefits:
        'Alto contenido de antioxidantes (EGCG), mejora la concentración, acelera el metabolismo, desintoxica naturalmente, proporciona energía sostenida.',
      ingredients:
        '100% Té Verde Matcha en polvo de grado ceremonial. Certificado orgánico USDA. Sin azúcares ni aditivos.',
      usageInstructions:
        'Tamizar 1 cucharadita (2g) en un bowl, agregar 60ml de agua a 80°C, batir con batidor de bambú hasta disolver. Puede prepararse con leche para matcha latte.',
      contraindications:
        'Contiene cafeína (aprox. 35mg por porción). Personas sensibles a la cafeína o con trastornos de ansiedad deben consumir con moderación.',
      featured: true,
      categoryName: 'Tés',
    },
    {
      name: 'Aceite de Coco Extra Virgen 1L',
      slug: 'aceite-de-coco-extra-virgen-1l',
      shortDescription:
        'Aceite de coco orgánico prensado en frío, ideal para cocina y cuidado personal.',
      description:
        'El Aceite de Coco Extra Virgen HGW se obtiene por prensado en frío de cocos frescos cultivados orgánicamente. Conserva todos sus nutrientes esenciales, incluyendo ácido láurico, vitamina E y antioxidantes. Versátil para cocinar, hidratar la piel y el cabello.',
      price: 32000,
      stock: 40,
      benefits:
        'Fuente de ácido láurico, promueve la salud cardiovascular, hidrata piel y cabello, propiedades antimicrobianas, ayuda en la digestión.',
      ingredients:
        '100% Aceite de Coco Extra Virgen orgánico. Prensa en frío. Sin hexano ni solventes químicos. Libre de gluten.',
      usageInstructions:
        'Uso culinario: consumir 1-2 cucharadas al día. Para cocinar, usar a fuego medio. Uso tópico: aplicar directamente sobre piel o cabello según necesidad.',
      contraindications:
        'Personas con alergia al coco deben evitar su consumo. Alto en grasas saturadas, consumir con moderación.',
      featured: false,
      categoryName: 'Aceites',
    },
    {
      name: 'Proteína de Guisante Orgánica 1kg',
      slug: 'proteina-de-guisante-organica-1kg',
      shortDescription:
        'Proteína vegetal de guisante amarillo, 25g de proteína por porción.',
      description:
        'La Proteína de Guisante Orgánica HGW se extrae de guisantes amarillos cultivados sin pesticidas. Contiene 25g de proteína completa por porción con todos los aminoácidos esenciales. Ideal para deportistas, veganos y personas que buscan una fuente limpia de proteína vegetal.',
      price: 65000,
      stock: 25,
      benefits:
        '25g de proteína por porción, aminoácidos completos (incluyendo BCAA), fácil digestión, libre de alérgenos comunes, sin saborizantes artificiales.',
      ingredients:
        '100% aislado de proteína de guisante amarillo orgánico. Enzimas digestivas añadidas para mejor absorción. Sin soya, gluten ni lácteos.',
      usageInstructions:
        'Mezclar 1 scoop (30g) en 250ml de agua, leche vegetal o smoothie. Consumir después del ejercicio o como complemento proteico entre comidas.',
      contraindications:
        'Personas con problemas renales deben consultar a su médico antes de consumir proteínas en polvo. Mantener fuera del alcance de niños.',
      featured: true,
      categoryName: 'Proteínas',
    },
    {
      name: 'Té Detox Herbal 30 bolsitas',
      slug: 'te-detox-herbal-30-bolsitas',
      shortDescription:
        'Mezcla herbal depurativa con boldo, menta y jengibre para limpieza natural.',
      description:
        'El Té Detox Herbal HGW combina boldo, menta, jengibre, diente de león y cardo mariano en una fórmula equilibrada para apoyar los procesos naturales de desintoxicación del organismo. Ideal para después de excesos alimenticios o como complemento para una alimentación saludable.',
      price: 22000,
      stock: 60,
      benefits:
        'Apoya la desintoxicación hepática, mejora la digestión, efecto diurético natural, rico en antioxidantes, ayuda a reducir la inflamación.',
      ingredients:
        'Boldo (hojas), Menta (hojas), Jengibre (raíz), Diente de León (raíz), Cardo Mariano (semillas), Hinojo (semillas). 100% natural.',
      usageInstructions:
        'Verter una bolsita en una taza de agua hirviendo, dejar reposar 5-7 minutos. Consumir 1-2 tazas al día, preferiblemente entre comidas.',
      contraindications:
        'Mujeres embarazadas o en lactancia no consumir. Personas con cálculos biliares o problemas hepáticos consultar con su médico.',
      featured: false,
      categoryName: 'Tés',
    },
    {
      name: 'Aceite Esencial de Menta 30ml',
      slug: 'aceite-esencial-de-menta-30ml',
      shortDescription:
        'Aceite esencial puro de menta para aromaterapia y aplicación tópica.',
      description:
        'El Aceite Esencial de Menta HGW se obtiene por destilación al vapor de hojas frescas de menta piperita. 100% puro y natural, sin diluyentes ni aditivos sintéticos. Ideal para aromaterapia, masajes, alivio de dolores musculares y para mejorar la concentración.',
      price: 28000,
      stock: 35,
      benefits:
        'Alivia dolores de cabeza y musculares, mejora la concentración y alerta mental, descongestiona las vías respiratorias, refresca el aliento.',
      ingredients:
        '100% Aceite esencial de Menta Piperita (Mentha x piperita). Destilado al vapor. Sin diluyentes, fragancias sintéticas ni aditivos.',
      usageInstructions:
        'Uso tópico: diluir 2-3 gotas en aceite portador y aplicar en áreas deseadas. Aromaterapia: agregar 3-5 gotas en difusor. No ingerir.',
      contraindications:
        'No ingerir. Mantener fuera del alcance de niños y mascotas. Evitar contacto con ojos y mucosas. No usar en menores de 6 años.',
      featured: false,
      categoryName: 'Aceites',
    },
  ];

  for (const productData of productsData) {
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existing) {
      console.log(`ℹ️  Producto ya existe: ${productData.name}`);
      continue;
    }

    const categoryId = categories[productData.categoryName];
    if (!categoryId) {
      console.warn(
        `⚠️  Categoría no encontrada para: ${productData.categoryName}`,
      );
      continue;
    }

    const { categoryName, ...createData } = productData;
    const product = await prisma.product.create({
      data: {
        ...createData,
        categoryId,
        images: {
          create: [
            {
              imageUrl: `/uploads/products/placeholder-${productData.slug}.jpg`,
              isPrimary: true,
            },
          ],
        },
      },
    });
    console.log(`✅ Producto creado: ${product.name}`);
  }

  console.log(`\n🎉 Seed completado. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
