import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ComingSoon = () => {
  return (
    <div className="min-h-screen flex flex-col font-nunito">
      <Navbar hideServiceLinks />
      <main className="flex-1 bg-[#f7f7f7] pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-10 md:p-14">
            <p className="text-xs tracking-[0.25em] uppercase text-[#136C9E] mb-4">Landlord Features</p>
            <h1 className="text-3xl md:text-5xl font-bold text-[#374957] mb-4 font-archive">Coming Soon</h1>
            <p className="text-base md:text-lg text-[#5A6670]">
              This section is currently in development and will be available soon.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoon;
