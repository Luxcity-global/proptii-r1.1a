import React from 'react';
import { FaFileContract } from 'react-icons/fa';

interface Contract {
  property: string;
  agent: string;
  email: string;
  phone: string;
}

const contracts: Contract[] = [
  {
    property: 'xch1jmlmu0caxawpgzfpd6ket8zlh3rx08ul6pywed9yxup84ef7jxhstcpm4d',
    agent: 'James Bond',
    email: 'Bond@gmail.com',
    phone: '08130990478',
  },
  {
    property: 'xch1jmlmu0caxawpgzfpd6ket8zlh3rx08ul6pywed9yxup84ef7jxhstcpm4d',
    agent: 'Pls Work',
    email: 'PlWrk@gmail.com',
    phone: '08130990478',
  },
  {
    property: 'xch1jmlmu0caxawpgzfpd6ket8zlh3rx08ul6pywed9yxup84ef7jxhstcpm4d',
    agent: 'LAt last',
    email: 'Unique',
    phone: '12346678',
  },
  {
    property: 'xch1jmlmu0caxawpgzfpd6ket8zlh3rx08ul6pywed9yxup84ef7jxhstcpm4d',
    agent: 'Jane Smoke',
    email: 'Jsmoke@gmail.com',
    phone: '08130990478',
  },
  {
    property: 'A address',
    agent: 'An Agent',
    email: 'Amail@gmail.com',
    phone: '123456',
  },
];

const TenantContracts: React.FC = () => {
  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-white p-4 rounded-lg shadow flex items-center" style={{ gap: '1rem', display: 'flex', flexDirection: 'row',justifyContent: 'start', alignItems: 'start', height: 'auto', width: 'auto', border: '1px solid #81B0F8',  }}>
          
          <div>
            <h2 className="text-xl font-semibold">6</h2>
            <p className="text-gray-600">Requested contracts</p>
            <p className="text-xs text-gray-500">As of 18/03/2025</p>
          </div>
          <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_1919_20172)">
                        <path
                    d="M14.1665 11.6667C14.1665 11.8877 14.0787 12.0997 13.9224 12.2559C13.7661 12.4122 13.5542 12.5 13.3332 12.5H6.6665C6.44549 12.5 6.23353 12.4122 6.07725 12.2559C5.92097 12.0997 5.83317 11.8877 5.83317 11.6667C5.83317 11.4457 5.92097 11.2337 6.07725 11.0774C6.23353 10.9211 6.44549 10.8334 6.6665 10.8334H13.3332C13.5542 10.8334 13.7661 10.9211 13.9224 11.0774C14.0787 11.2337 14.1665 11.4457 14.1665 11.6667ZM10.8332 14.1667H6.6665C6.44549 14.1667 6.23353 14.2545 6.07725 14.4108C5.92097 14.567 5.83317 14.779 5.83317 15C5.83317 15.221 5.92097 15.433 6.07725 15.5893C6.23353 15.7456 6.44549 15.8334 6.6665 15.8334H10.8332C11.0542 15.8334 11.2661 15.7456 11.4224 15.5893C11.5787 15.433 11.6665 15.221 11.6665 15C11.6665 14.779 11.5787 14.567 11.4224 14.4108C11.2661 14.2545 11.0542 14.1667 10.8332 14.1667ZM18.3332 8.73752V15.8334C18.3319 16.938 17.8924 17.9971 17.1113 18.7782C16.3302 19.5593 15.2712 19.9987 14.1665 20H5.83317C4.72851 19.9987 3.66947 19.5593 2.88835 18.7782C2.10724 17.9971 1.66783 16.938 1.6665 15.8334V4.16669C1.66783 3.06202 2.10724 2.00298 2.88835 1.22187C3.66947 0.440754 4.72851 0.00134242 5.83317 1.92072e-05H9.59567C10.362 -0.00195323 11.1212 0.148009 11.8292 0.441235C12.5372 0.734461 13.1801 1.16513 13.7207 1.70835L16.624 4.61335C17.1675 5.15355 17.5985 5.79623 17.8919 6.50416C18.1852 7.2121 18.3352 7.9712 18.3332 8.73752ZM12.5423 2.88669C12.2801 2.63265 11.9856 2.41412 11.6665 2.23669V5.83335C11.6665 6.05437 11.7543 6.26633 11.9106 6.42261C12.0669 6.57889 12.2788 6.66669 12.4998 6.66669H16.0965C15.919 6.34768 15.7001 6.05347 15.4457 5.79169L12.5423 2.88669ZM16.6665 8.73752C16.6665 8.60002 16.6398 8.46835 16.6273 8.33335H12.4998C11.8368 8.33335 11.2009 8.06996 10.7321 7.60112C10.2632 7.13228 9.99984 6.49639 9.99984 5.83335V1.70585C9.86484 1.69335 9.73234 1.66669 9.59567 1.66669H5.83317C5.17013 1.66669 4.53425 1.93008 4.0654 2.39892C3.59656 2.86776 3.33317 3.50364 3.33317 4.16669V15.8334C3.33317 16.4964 3.59656 17.1323 4.0654 17.6011C4.53425 18.07 5.17013 18.3334 5.83317 18.3334H14.1665C14.8295 18.3334 15.4654 18.07 15.9343 17.6011C16.4031 17.1323 16.6665 16.4964 16.6665 15.8334V8.73752Z"
                    fill={'#DC5F12'}
                        />
                      </g>
                    </svg>
        </div>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          Contracts Page
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Property</th>
              <th className="py-2">Agent</th>
              <th className="py-2">Email</th>
              <th className="py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{contract.property}</td>
                <td className="py-2">{contract.agent}</td>
                <td className="py-2">{contract.email}</td>
                <td className="py-2">{contract.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantContracts;