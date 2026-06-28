import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@printai.com' },
    update: {},
    create: {
      email: 'admin@printai.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log('Created admin user:', admin.email);

  // Create fabric types
  const fabrics = await Promise.all([
    prisma.fabric.upsert({
      where: { name: 'Cotton' },
      update: {},
      create: { name: 'Cotton', priceModifier: 0, isActive: true },
    }),
    prisma.fabric.upsert({
      where: { name: 'Polyester' },
      update: {},
      create: { name: 'Polyester', priceModifier: 50, isActive: true },
    }),
    prisma.fabric.upsert({
      where: { name: 'Cotton-Polyester Blend' },
      update: {},
      create: { name: 'Cotton-Polyester Blend', priceModifier: 30, isActive: true },
    }),
  ]);
  console.log('Created fabrics:', fabrics.length);

  // Create GSM options
  const gsms = await Promise.all([
    prisma.gSM.upsert({
      where: { value: 160 },
      update: {},
      create: { value: 160, priceModifier: 0, isActive: true },
    }),
    prisma.gSM.upsert({
      where: { value: 180 },
      update: {},
      create: { value: 180, priceModifier: 20, isActive: true },
    }),
    prisma.gSM.upsert({
      where: { value: 200 },
      update: {},
      create: { value: 200, priceModifier: 40, isActive: true },
    }),
    prisma.gSM.upsert({
      where: { value: 220 },
      update: {},
      create: { value: 220, priceModifier: 60, isActive: true },
    }),
  ]);
  console.log('Created GSM options:', gsms.length);

  // Create sizes
  const sizes = await Promise.all([
    prisma.size.upsert({
      where: { name: 'XS' },
      update: {},
      create: { name: 'XS', priceModifier: 0, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'S' },
      update: {},
      create: { name: 'S', priceModifier: 0, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'M' },
      update: {},
      create: { name: 'M', priceModifier: 0, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'L' },
      update: {},
      create: { name: 'L', priceModifier: 0, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'XL' },
      update: {},
      create: { name: 'XL', priceModifier: 50, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'XXL' },
      update: {},
      create: { name: 'XXL', priceModifier: 100, isActive: true },
    }),
    prisma.size.upsert({
      where: { name: 'XXXL' },
      update: {},
      create: { name: 'XXXL', priceModifier: 150, isActive: true },
    }),
  ]);
  console.log('Created sizes:', sizes.length);

  // Create colors
  const colors = await Promise.all([
    prisma.color.upsert({
      where: { name: 'White' },
      update: {},
      create: { name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true },
    }),
    prisma.color.upsert({
      where: { name: 'Black' },
      update: {},
      create: { name: 'Black', hexCode: '#000000', priceModifier: 0, isActive: true },
    }),
    prisma.color.upsert({
      where: { name: 'Navy Blue' },
      update: {},
      create: { name: 'Navy Blue', hexCode: '#000080', priceModifier: 0, isActive: true },
    }),
    prisma.color.upsert({
      where: { name: 'Red' },
      update: {},
      create: { name: 'Red', hexCode: '#FF0000', priceModifier: 0, isActive: true },
    }),
    prisma.color.upsert({
      where: { name: 'Green' },
      update: {},
      create: { name: 'Green', hexCode: '#008000', priceModifier: 0, isActive: true },
    }),
  ]);
  console.log('Created colors:', colors.length);

  // Create base pricing
  const pricing = await prisma.pricing.create({
    data: {
      basePrice: 299,
      isActive: true,
    },
  });
  console.log('Created base pricing:', pricing.basePrice);

  // Create pre-prompts with diverse categories
  const prePrompts = await Promise.all([
    // Space & Sci-Fi
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Cosmic Adventure',
        prompt: 'A vibrant space scene with planets, stars, and a rocket ship exploring the galaxy',
        category: 'Space',
        previewUrl: 'https://via.placeholder.com/400x400?text=Cosmic+Adventure',
        sortOrder: 1,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Cyberpunk City',
        prompt: 'Futuristic neon-lit cyberpunk cityscape with flying cars and holographic billboards',
        category: 'Sci-Fi',
        previewUrl: 'https://via.placeholder.com/400x400?text=Cyberpunk+City',
        sortOrder: 2,
      },
    }),
    
    // Nature & Landscapes
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        title: 'Mountain Sunset',
        prompt: 'Beautiful mountain landscape at sunset with orange and purple sky, peaceful and serene',
        category: 'Nature',
        previewUrl: 'https://via.placeholder.com/400x400?text=Mountain+Sunset',
        sortOrder: 3,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        title: 'Ocean Waves',
        prompt: 'Tropical beach with crystal clear turquoise waves, palm trees, and golden sand',
        category: 'Nature',
        previewUrl: 'https://via.placeholder.com/400x400?text=Ocean+Waves',
        sortOrder: 4,
      },
    }),
    
    // Abstract & Artistic
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000005',
        title: 'Abstract Geometry',
        prompt: 'Colorful geometric shapes and patterns in modern art style with bold colors',
        category: 'Abstract',
        previewUrl: 'https://via.placeholder.com/400x400?text=Abstract+Geometry',
        sortOrder: 5,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000006' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000006',
        title: 'Watercolor Dreams',
        prompt: 'Soft watercolor painting with flowing colors blending together, dreamy and ethereal',
        category: 'Abstract',
        previewUrl: 'https://via.placeholder.com/400x400?text=Watercolor+Dreams',
        sortOrder: 6,
      },
    }),
    
    // Animals & Wildlife
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000007' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000007',
        title: 'Majestic Lion',
        prompt: 'Powerful lion with flowing mane, regal and majestic, artistic portrait style',
        category: 'Animals',
        previewUrl: 'https://via.placeholder.com/400x400?text=Majestic+Lion',
        sortOrder: 7,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000008' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000008',
        title: 'Colorful Butterfly',
        prompt: 'Beautiful butterfly with vibrant colorful wings, detailed and intricate patterns',
        category: 'Animals',
        previewUrl: 'https://via.placeholder.com/400x400?text=Colorful+Butterfly',
        sortOrder: 8,
      },
    }),
    
    // Fantasy & Mythology
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000009' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000009',
        title: 'Dragon Guardian',
        prompt: 'Mythical dragon with scales and wings, guarding ancient treasure, fantasy art style',
        category: 'Fantasy',
        previewUrl: 'https://via.placeholder.com/400x400?text=Dragon+Guardian',
        sortOrder: 9,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000010' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000010',
        title: 'Phoenix Rising',
        prompt: 'Majestic phoenix bird rising from flames, vibrant fire colors, mythological creature',
        category: 'Fantasy',
        previewUrl: 'https://via.placeholder.com/400x400?text=Phoenix+Rising',
        sortOrder: 10,
      },
    }),
    
    // Urban & Street Art
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        title: 'Graffiti Style',
        prompt: 'Bold graffiti art with spray paint effect, urban street art style with vibrant colors',
        category: 'Urban',
        previewUrl: 'https://via.placeholder.com/400x400?text=Graffiti+Style',
        sortOrder: 11,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        title: 'City Skyline',
        prompt: 'Modern city skyline at night with illuminated skyscrapers and city lights',
        category: 'Urban',
        previewUrl: 'https://via.placeholder.com/400x400?text=City+Skyline',
        sortOrder: 12,
      },
    }),
    
    // Retro & Vintage
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000013' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000013',
        title: 'Retro Wave',
        prompt: '80s retro wave aesthetic with neon grid, sunset gradient, and vintage vibes',
        category: 'Retro',
        previewUrl: 'https://via.placeholder.com/400x400?text=Retro+Wave',
        sortOrder: 13,
      },
    }),
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000014' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000014',
        title: 'Vintage Poster',
        prompt: 'Vintage travel poster style with classic typography and muted color palette',
        category: 'Retro',
        previewUrl: 'https://via.placeholder.com/400x400?text=Vintage+Poster',
        sortOrder: 14,
      },
    }),
    
    // Minimalist
    prisma.prePrompt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000015' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000015',
        title: 'Minimal Line Art',
        prompt: 'Simple minimalist line art design, clean and elegant with negative space',
        category: 'Minimalist',
        previewUrl: 'https://via.placeholder.com/400x400?text=Minimal+Line+Art',
        sortOrder: 15,
      },
    }),
  ]);
  console.log('Created pre-prompts:', prePrompts.length);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
