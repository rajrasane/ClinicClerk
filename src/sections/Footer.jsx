const SITEMAP = [
  {
    title: "Properties",
    links: ["Buy Properties", "Rent Properties", "Sell Properties", "Property Valuation"],
  },
  {
    title: "Services",
    links: ["Property Management", "Legal Services", "Home Loans", "Contact Us"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Projects"],
  },
  {
    title: "Support",
    links: ["Help Center", "Privacy Policy", "Terms of Service", "Customer Support"],
  },
];

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="relative w-full bg-gray-800 text-white py-10">
      <div className="mx-auto w-full max-w-7xl px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {SITEMAP.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400">
            &copy; {currentYear} Swadesh Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;