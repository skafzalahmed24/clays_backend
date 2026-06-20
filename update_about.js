require('dotenv').config();
const { sequelize } = require('./config/db');
const Page = require('./models/Page');

const updateAboutPage = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const modules = {
            header: {
                title: 'The Essence of <br /><span className="italic text-primary">Natural Harmony</span>',
                eyebrow: 'Since 2012',
                subtitle: 'A journey back to nature\'s healing touch.'
            },
            story: {
                title: 'Nurturing beauty through <br /><span className="text-primary italic">nature\'s purity.</span>',
                content: 'Born from a profound respect for nature, we believe in the healing power of earth\'s finest botanicals. For over a decade, we have been crafting herbal skin and hair care products that blend ancient Ayurvedic wisdom with modern science.\n\nEvery formulation is a testament to purity, crafted without harsh chemicals or synthetics. We believe that true luxury lies in authentic, natural ingredients that nourish your skin, strengthen your hair, and revitalize your soul.'
            },
            values: [
                {
                    title: '100% Natural',
                    description: 'Crafted purely from organically grown herbs and botanical extracts.'
                },
                {
                    title: 'Cruelty Free',
                    description: 'Ethically tested and never tested on animals. Good for you, kind to earth.'
                },
                {
                    title: 'Holistic Wellness',
                    description: 'Formulas designed to balance your inner health and outer radiance.'
                }
            ],
            founder: {
                quote: 'True beauty is a reflection of wellness. When we nurture our bodies with nature\'s gifts, our skin glows and our hair flourishes.'
            }
        };

        const seo = {
            title: 'About Us | Clay - Herbal Skin & Hair Care',
            description: 'Learn about Clay, our commitment to natural beauty, and our herbal skin and hair care products.'
        };

        const [page, created] = await Page.findOrCreate({
            where: { slug: 'about' },
            defaults: {
                modules: modules,
                seo: seo
            }
        });

        if (!created) {
            page.modules = modules;
            page.seo = seo;
            await page.save();
        }

        console.log('Successfully updated About page data.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating About page data:', err);
        process.exit(1);
    }
};

updateAboutPage();
