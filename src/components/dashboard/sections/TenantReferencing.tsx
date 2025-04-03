import React from "react";
import { FaCheckCircle, FaEllipsisH, FaTimesCircle } from "react-icons/fa";
import {  formatDate, } from '../../../utils/formatters';
import { 
   Typography, 
  styled,
} from '@mui/material';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { FaUser, FaBriefcase, FaHome, FaMoneyBill, FaUserShield, FaBuilding } from "react-icons/fa";
import zIndex from "@mui/material/styles/zIndex";

interface CheckItem {
  name: string;
  status: "complete" | "notStarted";
}

interface Section {
  title: string;
  date: string;
  status: "Complete" | "Not Started";
  checks: CheckItem[];
  icon: JSX.Element;
}



const StatsNumber = styled(Typography)(({ theme }) => ({
    fontSize: '20pt',
    fontWeight: 700,
    color: 'white',
    marginBottom: theme.spacing(1)
}));




 // This should match the percentage in DashboardHome.tsx
const sections: Section[] = [
  {
    title: "Identity",
    date: "30/01/2025",
    status: "Complete",
    checks: [
      { name: "Name", status: "complete" },
      { name: "Contact", status: "complete" },
      { name: "Nationality", status: "complete" },
    ],
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1719_10279)">
    <path d="M10.6853 10.6851C11.7346 10.6851 12.7604 10.3739 13.6329 9.79098C14.5053 9.20801 15.1854 8.37941 15.5869 7.40997C15.9885 6.44053 16.0935 5.37378 15.8888 4.34462C15.6841 3.31547 15.1788 2.37013 14.4368 1.62815C13.6949 0.88617 12.7495 0.380875 11.7204 0.176164C10.6912 -0.028548 9.62446 0.0765175 8.65502 0.478074C7.68558 0.87963 6.85698 1.55964 6.27401 2.43212C5.69104 3.30459 5.37988 4.33035 5.37988 5.37967C5.38129 6.78633 5.9407 8.13497 6.93536 9.12963C7.93002 10.1243 9.27867 10.6837 10.6853 10.6851ZM10.6853 1.8427C11.3849 1.8427 12.0687 2.05014 12.6504 2.43879C13.232 2.82743 13.6853 3.37983 13.9531 4.02613C14.2208 4.67242 14.2908 5.38359 14.1543 6.06969C14.0179 6.7558 13.681 7.38602 13.1863 7.88068C12.6917 8.37533 12.0615 8.71219 11.3754 8.84867C10.6893 8.98514 9.97808 8.9151 9.33179 8.64739C8.68549 8.37969 8.1331 7.92635 7.74445 7.3447C7.3558 6.76305 7.14836 6.07921 7.14836 5.37967C7.14836 4.4416 7.52101 3.54196 8.18432 2.87865C8.84763 2.21535 9.74727 1.8427 10.6853 1.8427V1.8427Z" fill="#3F2E00"/>
    <path d="M10.6847 12.4531C8.57481 12.4555 6.55198 13.2947 5.06004 14.7866C3.5681 16.2785 2.7289 18.3014 2.72656 20.4113C2.72656 20.6458 2.81972 20.8707 2.98555 21.0365C3.15138 21.2024 3.37629 21.2955 3.6108 21.2955C3.84532 21.2955 4.07023 21.2024 4.23606 21.0365C4.40188 20.8707 4.49504 20.6458 4.49504 20.4113C4.49504 18.7697 5.14717 17.1953 6.30796 16.0345C7.46875 14.8737 9.04312 14.2216 10.6847 14.2216C12.3263 14.2216 13.9007 14.8737 15.0615 16.0345C16.2223 17.1953 16.8744 18.7697 16.8744 20.4113C16.8744 20.6458 16.9676 20.8707 17.1334 21.0365C17.2992 21.2024 17.5241 21.2955 17.7587 21.2955C17.9932 21.2955 18.2181 21.2024 18.3839 21.0365C18.5497 20.8707 18.6429 20.6458 18.6429 20.4113C18.6406 18.3014 17.8014 16.2785 16.3094 14.7866C14.8175 13.2947 12.7946 12.4555 10.6847 12.4531V12.4531Z" fill="#3F2E00"/>
    </g>
    <defs>
    <clipPath id="clip0_1719_10279">
    <rect width="21.2218" height="21.2218" fill="white" transform="translate(0.0742188 0.0742188)"/>
    </clipPath>
    </defs>
    </svg>,
  },
  {
    title: "Employment",
    date: "30/01/2025",
    status: "Complete" ,
    checks: [
      { name: "Employment Status", status: "complete" },
      { name: "Job Position", status: "notStarted" },
      { name: "Job Reference", status: "complete" },
      { name: "Company Details", status: "complete" },
    ],
    icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1724_13794)">
    <path d="M16.8748 3.61118H15.9021C15.6969 2.61324 15.1539 1.71656 14.3647 1.07228C13.5754 0.427995 12.5882 0.0755049 11.5693 0.0742188L9.80087 0.0742188C8.78204 0.0755049 7.79481 0.427995 7.00556 1.07228C6.21631 1.71656 5.67332 2.61324 5.46809 3.61118H4.49542C3.32328 3.61259 2.19954 4.07884 1.37071 4.90767C0.541878 5.73651 0.0756228 6.86024 0.0742188 8.03238L0.0742188 16.8748C0.0756228 18.0469 0.541878 19.1707 1.37071 19.9995C2.19954 20.8283 3.32328 21.2946 4.49542 21.296H16.8748C18.0469 21.2946 19.1707 20.8283 19.9995 19.9995C20.8283 19.1707 21.2946 18.0469 21.296 16.8748V8.03238C21.2946 6.86024 20.8283 5.73651 19.9995 4.90767C19.1707 4.07884 18.0469 3.61259 16.8748 3.61118ZM9.80087 1.8427H11.5693C12.116 1.84497 12.6487 2.01609 13.0944 2.33265C13.5401 2.64921 13.8771 3.09575 14.0594 3.61118H7.31084C7.49307 3.09575 7.8301 2.64921 8.27582 2.33265C8.72154 2.01609 9.25418 1.84497 9.80087 1.8427ZM4.49542 5.37966H16.8748C17.5783 5.37966 18.2531 5.65915 18.7505 6.15663C19.248 6.65411 19.5275 7.32884 19.5275 8.03238V10.6851H1.8427V8.03238C1.8427 7.32884 2.12218 6.65411 2.61966 6.15663C3.11715 5.65915 3.79188 5.37966 4.49542 5.37966ZM16.8748 19.5275H4.49542C3.79188 19.5275 3.11715 19.248 2.61966 18.7505C2.12218 18.2531 1.8427 17.5783 1.8427 16.8748V12.4536H9.80087V13.3378C9.80087 13.5723 9.89403 13.7973 10.0599 13.9631C10.2257 14.1289 10.4506 14.2221 10.6851 14.2221C10.9196 14.2221 11.1445 14.1289 11.3104 13.9631C11.4762 13.7973 11.5693 13.5723 11.5693 13.3378V12.4536H19.5275V16.8748C19.5275 17.5783 19.248 18.2531 18.7505 18.7505C18.2531 19.248 17.5783 19.5275 16.8748 19.5275Z" fill="#4B3B10"/>
    </g>
    <defs>
    <clipPath id="clip0_1724_13794">
    <rect width="21.2218" height="21.2218" fill="white" transform="translate(0.0742188 0.0742188)"/>
    </clipPath>
    </defs>
    </svg>
    
    ,
  },
  {
    title: "Residential",
    date: "30/01/2025",
    status: "Complete",
    checks: [
      { name: "Address", status: "notStarted" },
      { name: "Duration", status: "notStarted" },
    ],
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1724_13838)">
    <path d="M6.2639 12.4536C6.2639 12.6881 6.17074 12.913 6.00492 13.0788C5.83909 13.2447 5.61418 13.3378 5.37966 13.3378H4.49542C4.26091 13.3378 4.036 13.2447 3.87017 13.0788C3.70434 12.913 3.61118 12.6881 3.61118 12.4536C3.61118 12.2191 3.70434 11.9942 3.87017 11.8283C4.036 11.6625 4.26091 11.5693 4.49542 11.5693H5.37966C5.61418 11.5693 5.83909 11.6625 6.00492 11.8283C6.17074 11.9942 6.2639 12.2191 6.2639 12.4536ZM9.80087 11.5693H8.91663C8.68211 11.5693 8.4572 11.6625 8.29137 11.8283C8.12555 11.9942 8.03238 12.2191 8.03238 12.4536C8.03238 12.6881 8.12555 12.913 8.29137 13.0788C8.4572 13.2447 8.68211 13.3378 8.91663 13.3378H9.80087C10.0354 13.3378 10.2603 13.2447 10.4261 13.0788C10.5919 12.913 10.6851 12.6881 10.6851 12.4536C10.6851 12.2191 10.5919 11.9942 10.4261 11.8283C10.2603 11.6625 10.0354 11.5693 9.80087 11.5693ZM5.37966 15.1063H4.49542C4.26091 15.1063 4.036 15.1995 3.87017 15.3653C3.70434 15.5311 3.61118 15.756 3.61118 15.9906C3.61118 16.2251 3.70434 16.45 3.87017 16.6158C4.036 16.7816 4.26091 16.8748 4.49542 16.8748H5.37966C5.61418 16.8748 5.83909 16.7816 6.00492 16.6158C6.17074 16.45 6.2639 16.2251 6.2639 15.9906C6.2639 15.756 6.17074 15.5311 6.00492 15.3653C5.83909 15.1995 5.61418 15.1063 5.37966 15.1063ZM9.80087 15.1063H8.91663C8.68211 15.1063 8.4572 15.1995 8.29137 15.3653C8.12555 15.5311 8.03238 15.756 8.03238 15.9906C8.03238 16.2251 8.12555 16.45 8.29137 16.6158C8.4572 16.7816 8.68211 16.8748 8.91663 16.8748H9.80087C10.0354 16.8748 10.2603 16.7816 10.4261 16.6158C10.5919 16.45 10.6851 16.2251 10.6851 15.9906C10.6851 15.756 10.5919 15.5311 10.4261 15.3653C10.2603 15.1995 10.0354 15.1063 9.80087 15.1063ZM5.37966 4.49542H4.49542C4.26091 4.49542 4.036 4.58858 3.87017 4.75441C3.70434 4.92024 3.61118 5.14515 3.61118 5.37966C3.61118 5.61418 3.70434 5.83909 3.87017 6.00492C4.036 6.17074 4.26091 6.2639 4.49542 6.2639H5.37966C5.61418 6.2639 5.83909 6.17074 6.00492 6.00492C6.17074 5.83909 6.2639 5.61418 6.2639 5.37966C6.2639 5.14515 6.17074 4.92024 6.00492 4.75441C5.83909 4.58858 5.61418 4.49542 5.37966 4.49542ZM9.80087 4.49542H8.91663C8.68211 4.49542 8.4572 4.58858 8.29137 4.75441C8.12555 4.92024 8.03238 5.14515 8.03238 5.37966C8.03238 5.61418 8.12555 5.83909 8.29137 6.00492C8.4572 6.17074 8.68211 6.2639 8.91663 6.2639H9.80087C10.0354 6.2639 10.2603 6.17074 10.4261 6.00492C10.5919 5.83909 10.6851 5.61418 10.6851 5.37966C10.6851 5.14515 10.5919 4.92024 10.4261 4.75441C10.2603 4.58858 10.0354 4.49542 9.80087 4.49542ZM5.37966 8.03238H4.49542C4.26091 8.03238 4.036 8.12555 3.87017 8.29137C3.70434 8.4572 3.61118 8.68211 3.61118 8.91663C3.61118 9.15114 3.70434 9.37605 3.87017 9.54188C4.036 9.70771 4.26091 9.80087 4.49542 9.80087H5.37966C5.61418 9.80087 5.83909 9.70771 6.00492 9.54188C6.17074 9.37605 6.2639 9.15114 6.2639 8.91663C6.2639 8.68211 6.17074 8.4572 6.00492 8.29137C5.83909 8.12555 5.61418 8.03238 5.37966 8.03238ZM9.80087 8.03238H8.91663C8.68211 8.03238 8.4572 8.12555 8.29137 8.29137C8.12555 8.4572 8.03238 8.68211 8.03238 8.91663C8.03238 9.15114 8.12555 9.37605 8.29137 9.54188C8.4572 9.70771 8.68211 9.80087 8.91663 9.80087H9.80087C10.0354 9.80087 10.2603 9.70771 10.4261 9.54188C10.5919 9.37605 10.6851 9.15114 10.6851 8.91663C10.6851 8.68211 10.5919 8.4572 10.4261 8.29137C10.2603 8.12555 10.0354 8.03238 9.80087 8.03238ZM21.296 8.91663V16.8748C21.2946 18.0469 20.8283 19.1707 19.9995 19.9995C19.1707 20.8283 18.0469 21.2946 16.8748 21.296H4.49542C3.32328 21.2946 2.19954 20.8283 1.37071 19.9995C0.541878 19.1707 0.0756228 18.0469 0.0742188 16.8748L0.0742188 4.49542C0.0756228 3.32328 0.541878 2.19954 1.37071 1.37071C2.19954 0.541878 3.32328 0.0756228 4.49542 0.0742188L9.80087 0.0742188C10.973 0.0756228 12.0967 0.541878 12.9256 1.37071C13.7544 2.19954 14.2207 3.32328 14.2221 4.49542H16.8748C18.0469 4.49683 19.1707 4.96308 19.9995 5.79191C20.8283 6.62075 21.2946 7.74448 21.296 8.91663ZM4.49542 19.5275H12.4536V4.49542C12.4536 3.79188 12.1741 3.11715 11.6766 2.61966C11.1791 2.12218 10.5044 1.8427 9.80087 1.8427H4.49542C3.79188 1.8427 3.11715 2.12218 2.61966 2.61966C2.12218 3.11715 1.8427 3.79188 1.8427 4.49542V16.8748C1.8427 17.5783 2.12218 18.2531 2.61966 18.7505C3.11715 19.248 3.79188 19.5275 4.49542 19.5275ZM19.5275 8.91663C19.5275 8.21308 19.248 7.53835 18.7505 7.04087C18.2531 6.54339 17.5783 6.2639 16.8748 6.2639H14.2221V19.5275H16.8748C17.5783 19.5275 18.2531 19.248 18.7505 18.7505C19.248 18.2531 19.5275 17.5783 19.5275 16.8748V8.91663ZM16.8748 11.5693C16.6999 11.5693 16.5289 11.6212 16.3835 11.7184C16.2381 11.8155 16.1248 11.9536 16.0579 12.1152C15.9909 12.2768 15.9734 12.4546 16.0075 12.6261C16.0417 12.7976 16.1259 12.9552 16.2495 13.0788C16.3732 13.2025 16.5308 13.2867 16.7023 13.3208C16.8738 13.355 17.0516 13.3374 17.2132 13.2705C17.3748 13.2036 17.5128 13.0903 17.61 12.9448C17.7072 12.7994 17.759 12.6285 17.759 12.4536C17.759 12.2191 17.6659 11.9942 17.5 11.8283C17.3342 11.6625 17.1093 11.5693 16.8748 11.5693ZM16.8748 15.1063C16.6999 15.1063 16.5289 15.1582 16.3835 15.2553C16.2381 15.3525 16.1248 15.4906 16.0579 15.6522C15.9909 15.8137 15.9734 15.9915 16.0075 16.1631C16.0417 16.3346 16.1259 16.4921 16.2495 16.6158C16.3732 16.7395 16.5308 16.8237 16.7023 16.8578C16.8738 16.8919 17.0516 16.8744 17.2132 16.8075C17.3748 16.7406 17.5128 16.6272 17.61 16.4818C17.7072 16.3364 17.759 16.1654 17.759 15.9906C17.759 15.756 17.6659 15.5311 17.5 15.3653C17.3342 15.1995 17.1093 15.1063 16.8748 15.1063ZM16.8748 8.03238C16.6999 8.03238 16.5289 8.08424 16.3835 8.18141C16.2381 8.27857 16.1248 8.41667 16.0579 8.57824C15.9909 8.73981 15.9734 8.91761 16.0075 9.08913C16.0417 9.26066 16.1259 9.41821 16.2495 9.54188C16.3732 9.66554 16.5308 9.74976 16.7023 9.78388C16.8738 9.81799 17.0516 9.80048 17.2132 9.73356C17.3748 9.66663 17.5128 9.5533 17.61 9.40788C17.7072 9.26247 17.759 9.09151 17.759 8.91663C17.759 8.68211 17.6659 8.4572 17.5 8.29137C17.3342 8.12555 17.1093 8.03238 16.8748 8.03238Z" fill="#4B3B10"/>
    </g>
    <defs>
    <clipPath id="clip0_1724_13838">
    <rect width="21.2218" height="21.2218" fill="white" transform="translate(0.0742188 0.0742188)"/>
    </clipPath>
    </defs>
    </svg>
    ,
  },
  {
    title: "Financial",
    date: "30/01/2025",
    status:"Not Started",
    checks: [{ name: "Proof of Income", status: "notStarted" },
            { name: "Monthly Income", status: "notStarted" }
    ],
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1726_13876)">
    <path d="M20.4118 19.5275H2.72694C2.49243 19.5275 2.26752 19.4344 2.10169 19.2685C1.93586 19.1027 1.8427 18.8778 1.8427 18.6433V0.958459C1.8427 0.723944 1.74954 0.499034 1.58371 0.333207C1.41788 0.16738 1.19297 0.0742188 0.958459 0.0742188C0.723944 0.0742188 0.499034 0.16738 0.333207 0.333207C0.16738 0.499034 0.0742188 0.723944 0.0742188 0.958459L0.0742188 18.6433C0.0742188 19.3468 0.353701 20.0215 0.851183 20.519C1.34866 21.0165 2.0234 21.296 2.72694 21.296H20.4118C20.6463 21.296 20.8712 21.2028 21.037 21.037C21.2028 20.8712 21.296 20.6463 21.296 20.4118C21.296 20.1772 21.2028 19.9523 21.037 19.7865C20.8712 19.6207 20.6463 19.5275 20.4118 19.5275Z" fill="#3F2E00"/>
    <path d="M13.3374 17.7589C13.5719 17.7589 13.7968 17.6658 13.9626 17.5C14.1284 17.3341 14.2216 17.1092 14.2216 16.8747V10.685C14.2216 10.4505 14.1284 10.2256 13.9626 10.0598C13.7968 9.89394 13.5719 9.80078 13.3374 9.80078C13.1029 9.80078 12.8779 9.89394 12.7121 10.0598C12.5463 10.2256 12.4531 10.4505 12.4531 10.685V16.8747C12.4531 17.1092 12.5463 17.3341 12.7121 17.5C12.8779 17.6658 13.1029 17.7589 13.3374 17.7589Z" fill="#3F2E00"/>
    <path d="M6.26412 17.7589C6.49864 17.7589 6.72355 17.6658 6.88938 17.5C7.0552 17.3341 7.14836 17.1092 7.14836 16.8747V10.685C7.14836 10.4505 7.0552 10.2256 6.88938 10.0598C6.72355 9.89394 6.49864 9.80078 6.26412 9.80078C6.02961 9.80078 5.8047 9.89394 5.63887 10.0598C5.47304 10.2256 5.37988 10.4505 5.37988 10.685V16.8747C5.37988 17.1092 5.47304 17.3341 5.63887 17.5C5.8047 17.6658 6.02961 17.7589 6.26412 17.7589Z" fill="#3F2E00"/>
    <path d="M16.8745 17.7593C17.109 17.7593 17.3339 17.6661 17.4997 17.5003C17.6656 17.3344 17.7587 17.1095 17.7587 16.875V6.26412C17.7587 6.02961 17.6656 5.8047 17.4997 5.63887C17.3339 5.47304 17.109 5.37988 16.8745 5.37988C16.64 5.37988 16.415 5.47304 16.2492 5.63887C16.0834 5.8047 15.9902 6.02961 15.9902 6.26412V16.875C15.9902 17.1095 16.0834 17.3344 16.2492 17.5003C16.415 17.6661 16.64 17.7593 16.8745 17.7593Z" fill="#3F2E00"/>
    <path d="M9.80123 17.7593C10.0357 17.7593 10.2607 17.6661 10.4265 17.5003C10.5923 17.3344 10.6855 17.1095 10.6855 16.875V6.26412C10.6855 6.02961 10.5923 5.8047 10.4265 5.63887C10.2607 5.47304 10.0357 5.37988 9.80123 5.37988C9.56672 5.37988 9.34181 5.47304 9.17598 5.63887C9.01015 5.8047 8.91699 6.02961 8.91699 6.26412V16.875C8.91699 17.1095 9.01015 17.3344 9.17598 17.5003C9.34181 17.6661 9.56672 17.7593 9.80123 17.7593Z" fill="#3F2E00"/>
    </g>
    
    </svg>
    ,
  },
  {
    title: "Guarantor",
    date: "30/01/2025",
    status: "Not Started",
    checks: [{ name: "Address", status: "notStarted" },
            { name: "Name", status: "notStarted" },
            { name: "Contact", status: "notStarted" }],
    
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1726_13921)">
    <path d="M6.70602 11.5693C5.91904 11.5693 5.14972 11.336 4.49536 10.8988C3.84101 10.4615 3.331 9.84008 3.02983 9.113C2.72866 8.38591 2.64986 7.58585 2.8034 6.81399C2.95693 6.04212 3.3359 5.33311 3.89239 4.77663C4.44887 4.22014 5.15788 3.84117 5.92974 3.68764C6.70161 3.53411 7.50167 3.61291 8.22875 3.91407C8.95584 4.21524 9.57728 4.72525 10.0145 5.37961C10.4517 6.03396 10.6851 6.80328 10.6851 7.59027C10.6839 8.64523 10.2643 9.65664 9.51837 10.4026C8.7724 11.1486 7.76098 11.5682 6.70602 11.5693ZM6.70602 5.37966C6.26881 5.37966 5.84141 5.50931 5.47788 5.75222C5.11435 5.99512 4.83101 6.34037 4.66369 6.74431C4.49638 7.14824 4.4526 7.59272 4.5379 8.02153C4.62319 8.45035 4.83373 8.84424 5.14289 9.1534C5.45205 9.46256 5.84594 9.6731 6.27476 9.75839C6.70357 9.84369 7.14805 9.79991 7.55198 9.6326C7.95592 9.46528 8.30117 9.18194 8.54407 8.81841C8.78698 8.45488 8.91663 8.02748 8.91663 7.59027C8.91663 7.00398 8.68372 6.4417 8.26916 6.02713C7.85459 5.61257 7.29231 5.37966 6.70602 5.37966ZM13.3378 20.4118V19.9696C13.3378 18.2108 12.6391 16.5239 11.3954 15.2802C10.1517 14.0365 8.46489 13.3378 6.70602 13.3378C4.94716 13.3378 3.26033 14.0365 2.01663 15.2802C0.772925 16.5239 0.0742188 18.2108 0.0742188 19.9696L0.0742188 20.4118C0.0742188 20.6463 0.16738 20.8712 0.333207 21.037C0.499034 21.2028 0.723944 21.296 0.958459 21.296C1.19297 21.296 1.41788 21.2028 1.58371 21.037C1.74954 20.8712 1.8427 20.6463 1.8427 20.4118V19.9696C1.8427 18.6798 2.35508 17.4428 3.26713 16.5307C4.17918 15.6187 5.41619 15.1063 6.70602 15.1063C7.99586 15.1063 9.23286 15.6187 10.1449 16.5307C11.057 17.4428 11.5693 18.6798 11.5693 19.9696V20.4118C11.5693 20.6463 11.6625 20.8712 11.8283 21.037C11.9942 21.2028 12.2191 21.296 12.4536 21.296C12.6881 21.296 12.913 21.2028 13.0788 21.037C13.2447 20.8712 13.3378 20.6463 13.3378 20.4118ZM21.296 15.9906C21.296 14.7957 20.9501 13.6263 20.3001 12.6237C19.6501 11.6211 18.7238 10.828 17.633 10.3402C16.5422 9.85246 15.3335 9.69086 14.1529 9.87491C12.9722 10.059 11.8701 10.5808 10.9796 11.3775C10.8918 11.4546 10.8202 11.5483 10.7689 11.6532C10.7176 11.7582 10.6876 11.8722 10.6806 11.9888C10.6736 12.1054 10.6898 12.2223 10.7282 12.3326C10.7666 12.4429 10.8265 12.5445 10.9045 12.6315C10.9824 12.7185 11.0768 12.7893 11.1822 12.8396C11.2876 12.8899 11.4019 12.9189 11.5186 12.9248C11.6352 12.9307 11.7519 12.9134 11.8618 12.874C11.9718 12.8345 12.0728 12.7737 12.1591 12.695C12.7953 12.1261 13.5825 11.7535 14.4258 11.6221C15.2691 11.4907 16.1323 11.6063 16.9114 11.9547C17.6905 12.3031 18.352 12.8696 18.8163 13.5858C19.2805 14.3019 19.5275 15.1371 19.5275 15.9906C19.5275 16.2251 19.6207 16.45 19.7865 16.6158C19.9523 16.7816 20.1772 16.8748 20.4118 16.8748C20.6463 16.8748 20.8712 16.7816 21.037 16.6158C21.2028 16.45 21.296 16.2251 21.296 15.9906ZM15.5484 8.03239C14.7614 8.03239 13.9921 7.79902 13.3378 7.36179C12.6834 6.92456 12.1734 6.30311 11.8722 5.57603C11.5711 4.84895 11.4923 4.04889 11.6458 3.27702C11.7993 2.50516 12.1783 1.79615 12.7348 1.23967C13.2913 0.683182 14.0003 0.304211 14.7722 0.150678C15.544 -0.00285629 16.3441 0.0759428 17.0712 0.37711C17.7982 0.678278 18.4197 1.18829 18.8569 1.84264C19.2941 2.497 19.5275 3.26632 19.5275 4.0533C19.5263 5.10826 19.1067 6.11968 18.3608 6.86565C17.6148 7.61162 16.6034 8.03122 15.5484 8.03239ZM15.5484 1.8427C15.1112 1.8427 14.6838 1.97235 14.3203 2.21526C13.9568 2.45816 13.6734 2.80341 13.5061 3.20734C13.3388 3.61128 13.295 4.05576 13.3803 4.48457C13.4656 4.91339 13.6761 5.30728 13.9853 5.61644C14.2945 5.92559 14.6883 6.13613 15.1172 6.22143C15.546 6.30673 15.9905 6.26295 16.3944 6.09563C16.7983 5.92832 17.1436 5.64498 17.3865 5.28145C17.6294 4.91792 17.759 4.49052 17.759 4.0533C17.759 3.46702 17.5261 2.90474 17.1116 2.49017C16.697 2.0756 16.1347 1.8427 15.5484 1.8427Z" fill="#3F2E00"/>
    </g>
    <defs>
    <clipPath id="clip0_1726_13921">
    <rect width="21.2218" height="21.2218" fill="white" transform="translate(0.0742188 0.0742188)"/>
    </clipPath>
    </defs>
    </svg>
    ,
  },
  {
    title: "Agent Details",
    date: "30/01/2025",
    status:"Not Started",
    checks: [{ name: "Personal Details", status: "notStarted" }],
    icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1726_13952)">
    <path d="M4.93769 15.1058C5.67022 15.1058 6.26405 14.512 6.26405 13.7795C6.26405 13.047 5.67022 12.4531 4.93769 12.4531C4.20516 12.4531 3.61133 13.047 3.61133 13.7795C3.61133 14.512 4.20516 15.1058 4.93769 15.1058Z" fill="#3F2E00"/>
    <path d="M16.8748 2.72656H4.49542C2.01955 2.72656 0.0742188 4.67189 0.0742188 7.14777V14.2217C0.0742188 16.6976 2.01955 18.6429 4.49542 18.6429H16.8748C19.3507 18.6429 21.296 16.6976 21.296 14.2217V7.14777C21.296 4.67189 19.3507 2.72656 16.8748 2.72656ZM4.49542 4.49504H16.8748C18.378 4.49504 19.5275 5.64456 19.5275 7.14777H1.8427C1.8427 5.64456 2.99221 4.49504 4.49542 4.49504ZM16.8748 16.8744H4.49542C2.99221 16.8744 1.8427 15.7249 1.8427 14.2217V8.91625H19.5275V14.2217C19.5275 15.7249 18.378 16.8744 16.8748 16.8744Z" fill="#3F2E00"/>
    </g>
    <defs>
    <clipPath id="clip0_1726_13952">
    <rect width="21.2218" height="21.2218" fill="white" transform="translate(0.0742188 0.0742188)"/>
    </clipPath>
    </defs>
    </svg>
    ,
  },
];



const ProgressItem: React.FC<{ check: CheckItem }> = ({ check }) => {
  let icon;
  if (check.status === "complete") {
    icon = <FaCheckCircle className="text-green-500" />;
  } else if (check.status === "notStarted") {
    icon = <FaEllipsisH className="text-orange-500" />;
  } else {
    icon = <FaTimesCircle className="text-gray-400" />;
  }

  return (
    <div className="flex justify-between items-center text-sm" style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '32px', paddingBottom: '0.5rem', paddingTop: '0.5rem', paddingLeft: '1rem', paddingRight: '1rem', width: '100%', height: '40px', marginBottom: '0.5rem', }}>
      <span>{check.name}</span>
      {icon}
    </div>
  );
};

const TenantReferencing: React.FC = () => {
  const { 
    
    dashboardSummary, 
    
  } = useDashboardData();

  
  const referencingProgress = (dashboardSummary?.referencing.progress || 0); // This should match the percentage in DashboardHome.tsx

  
  const completedSteps = dashboardSummary?.referencing.completedSteps || 0;
  const totalSteps = dashboardSummary?.referencing.totalSteps || 1; // Avoid division by zero

  // Calculate the progress as a fraction of the total steps
  const progressFraction = completedSteps / totalSteps;

  // Calculate the strokeDashoffset based on the progress fraction
  const strokeDashoffset = 251 * (1 - progressFraction);
  

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#EDF3FA' }}>
      {/* Referencing Progress */}
      <Typography variant="h5" component="h1">
                       Referencing
      </Typography>
      <div className="grid grid-cols-3 gap-0" style={{  display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', }}>
        {/* Left Panel */}
        <div className="col-span-1 bg-white p-4 rounded-lg shadow flex-col items-end h-full" style={{ display: 'flex',    flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', paddingBottom: '1rem', gap: '0rem', width: '30%', height: '810px'}}>
          <div className="progrecircle text-center" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2rem', padding: '0rem', backgroundColor: '#ECEFED', width: '200px', height: '200px', borderRadius: '2000px', boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',border: '1px rgb(214, 214, 214) solid' }}>
            <div className="relative w-300px h-300px mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <pattern id="image" patternUnits="userSpaceOnUse" width="100" height="100"  >
                  <image href="/images/shield.png" x="-90" y="-90" width="280" height="280"  />
                  </pattern>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="orange"
                  strokeWidth="8"
                  fill="url(#image)"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={strokeDashoffset}
                />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white" style={{ width: '100%', height: '100%',  }}>
                {referencingProgress === 6 ? (
                  <svg width="20" height="20" viewBox="-3 -3 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24%', height: '24%',  }}>
                  <g clip-path="url(#clip0_1726_13952)">
                  <path d="M25.5372 11.3595C25.2208 11.0993 24.7425 10.7061 24.6879 10.502C24.6267 10.2727 24.8418 9.69612 24.9988 9.27507C25.3028 8.45934 25.6477 7.53463 25.1924 6.74773C24.7316 5.95136 23.75 5.78801 22.8838 5.64381C22.4712 5.57501 21.8477 5.47119 21.6882 5.31175C21.5288 5.15231 21.425 4.52877 21.3562 4.11617C21.212 3.24996 21.0484 2.2684 20.2521 1.80759C19.4656 1.35235 18.5407 1.69718 17.7247 2.00123C17.3039 2.1582 16.7271 2.37284 16.498 2.31187C16.2939 2.25728 15.9007 1.77896 15.6403 1.46255C15.0767 0.777214 14.4377 0 13.5 0C12.5623 0 11.9233 0.777214 11.3595 1.46276C11.0993 1.77917 10.7061 2.25748 10.502 2.31207C10.2725 2.37305 9.69612 2.1582 9.27507 2.00123C8.45934 1.69718 7.53463 1.35235 6.74773 1.80759C5.95136 2.2684 5.78801 3.24996 5.64381 4.11617C5.57501 4.52877 5.47119 5.15231 5.31175 5.31175C5.15231 5.47119 4.52877 5.57501 4.11617 5.64381C3.24996 5.78801 2.2684 5.95157 1.80759 6.74794C1.35235 7.53463 1.69718 8.45934 2.00123 9.27528C2.1582 9.69612 2.37305 10.2729 2.31187 10.502C2.25728 10.7061 1.77896 11.0993 1.46255 11.3597C0.777214 11.9233 0 12.5623 0 13.5C0 14.4377 0.777214 15.0767 1.46276 15.6405C1.77917 15.9007 2.25748 16.2939 2.31207 16.498C2.37325 16.7273 2.1582 17.3039 2.00123 17.7249C1.69718 18.5407 1.35235 19.4654 1.80759 20.2523C2.2684 21.0486 3.24996 21.212 4.11617 21.3562C4.52877 21.425 5.15231 21.5288 5.31175 21.6882C5.47119 21.8477 5.57501 22.4712 5.64381 22.8838C5.78801 23.75 5.95157 24.7316 6.74794 25.1924C7.53442 25.6477 8.45934 25.3028 9.27528 24.9988C9.69612 24.8418 10.2731 24.6272 10.502 24.6881C10.7061 24.7427 11.0993 25.221 11.3597 25.5374C11.9233 26.2228 12.5623 27 13.5 27C14.4377 27 15.0767 26.2228 15.6405 25.5372C15.9007 25.2208 16.2939 24.7425 16.498 24.6879C16.7275 24.6272 17.3039 24.8418 17.7249 24.9988C18.5407 25.3026 19.4654 25.6477 20.2523 25.1924C21.0486 24.7316 21.212 23.75 21.3562 22.8838C21.425 22.4712 21.5288 21.8477 21.6882 21.6882C21.8477 21.5288 22.4712 21.425 22.8838 21.3562C23.75 21.212 24.7316 21.0484 25.1924 20.2521C25.6477 19.4654 25.3028 18.5407 24.9988 17.7247C24.8418 17.3039 24.627 16.7271 24.6881 16.498C24.7427 16.2939 25.221 15.9007 25.5374 15.6403C26.2228 15.0767 27 14.4377 27 13.5C27 12.5623 26.2228 11.9233 25.5372 11.3595Z" fill="white"/>
                  <path d="M25.4831 11.3595C25.1549 11.0993 24.6589 10.7061 24.6023 10.502C24.5388 10.2727 24.7619 9.69612 24.9247 9.27507C25.24 8.45934 25.5976 7.53463 25.1255 6.74773C24.6476 5.95136 23.6297 5.78801 22.7314 5.64381C22.3035 5.57501 21.6569 5.47119 21.4915 5.31175C21.3262 5.15231 21.2185 4.52877 21.1472 4.11617C20.9976 3.24996 20.828 2.2684 20.0021 1.80759C19.1865 1.35235 18.2274 1.69718 17.3812 2.00123C16.9448 2.1582 16.3466 2.37284 16.1091 2.31187C15.8974 2.25728 15.4896 1.77896 15.2195 1.46255C14.6351 0.777214 13.9724 0 13 0V27C13.9724 27 14.6351 26.2228 15.2198 25.5372C15.4896 25.2208 15.8974 24.7425 16.1091 24.6879C16.347 24.6272 16.9448 24.8418 17.3814 24.9988C18.2274 25.3026 19.1863 25.6477 20.0023 25.1924C20.8282 24.7316 20.9976 23.75 21.1472 22.8838C21.2185 22.4712 21.3262 21.8477 21.4915 21.6882C21.6569 21.5288 22.3035 21.425 22.7314 21.3562C23.6297 21.212 24.6476 21.0484 25.1255 20.2521C25.5976 19.4654 25.24 18.5407 24.9247 17.7247C24.7619 17.3039 24.5391 16.7271 24.6025 16.498C24.6591 16.2939 25.1552 15.9007 25.4833 15.6403C26.194 15.0767 27 14.4377 27 13.5C27 12.5623 26.194 11.9233 25.4831 11.3595Z" fill="#F5F5F5"/>
                  <path d="M19.7096 10.0913C19.6311 9.54212 19.3435 9.05618 18.8996 8.7235C18.4559 8.39061 17.909 8.25054 17.3598 8.32881C16.8106 8.4073 16.3249 8.69507 15.992 9.13878L12.7556 13.4537L11.3336 12.0318C10.5239 11.222 9.20635 11.222 8.39638 12.0318C7.58662 12.8415 7.58662 14.1593 8.39638 14.969L11.5118 18.0843C11.904 18.4767 12.4256 18.6926 12.9804 18.6926C13.0294 18.6926 13.0788 18.6909 13.1276 18.6874C13.7285 18.6448 14.2806 18.3438 14.6419 17.8618L19.3151 11.6311C19.648 11.1872 19.788 10.6405 19.7096 10.0913Z" fill="#2A6C00"/>
                  </g>
                  <defs>
                  <clipPath id="clip0_1726_13952">
                  <rect width="100px" height="100px" fill="white" transform="translate(0.0742188 0.0742188)"/>
                  </clipPath>
                  </defs>
                  </svg>
                ) : (
                  <StatsNumber style={{ zIndex: 20, fill: 'white' }}>
                  {referencingProgress}
                  </StatsNumber>
                )}
                </div>
              
            </div>
            
            
          </div>

          
                {/*Reference Progress Tracker */}
            <div className="mt-4 w-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', }}>
            <p className=" text-gray-700 font-semibold " >Referencing Progress</p>
            {sections.map((section) => (
              <div
              key={section.title}
              className={`flex justify-between items-center py-2 px-4 rounded-full border-2 ${
              section.status === "Complete"
              ? "border-green-500 "
              : section.status === "Not Started"
              ? "border-orange-500"
              : "border-gray-400"
              } w-full`}
              >
              <span>{section.title} Check</span>
              {section.status === "Complete" ? (
              <FaCheckCircle className="text-green-500" />
              ) : section.status === "Not Started" ? (
              <FaEllipsisH className="text-orange-500" />
              ) : (
              <FaTimesCircle className="text-gray-400" />
              )}
              </div>
            ))}
            </div>
          

            <button
            className="w-full text-white py-2 rounded-lg mt-4 hover:bg-blue-700"
            style={{
              backgroundColor: '#136C9E',
              borderRadius: '32px',
              padding: '1rem',
              width: '100%',
              marginTop: '1rem',
            }}
            onClick={() => {
              window.location.href = '/referencing';
            }}
            >
            Resume Process
            </button>
        </div>

        {/* Right Panel */}
        <div className="col-span-2 grid grid-cols-2 gap-4 " style={{  borderRadius: '8px', padding: '1rem', width: '100%' }}>
          {sections.map((section) => (
                <div key={section.title} className="p-0 flex flex-row rounded-lg shadow" style={{ backgroundColor: 'white' }}>
                <div className="flex flex-col justify-between items-start"style={{ backgroundColor: '#4E97CC', borderRadius: '8px 0 0 8px', padding: '1rem', width:'30%', height: '260px' }}>
                  <div className=" SectionIcon flex justify-center items-center bg-white rounded-full w-10 h-10" style={{ color: '#374957' }}>
                    {section.icon}
                  </div>
                    <div className="mt-auto">
                    <h2 className="CardName text-lg font-semibold" style={{ color: 'white' }}>{section.title}</h2>
                    <p className="text-xs" style={{ color: 'white' }} >As of {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>

                
              
                <div className="statusanditem " style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', width:'70%', height: '260px'}}>
                  <div className="mt-2 space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem',  height: '260px',  }}>
                    <span
                      className={`px-2 py-1 text-xs rounded width-100%  ${
                        section.status === "Complete"
                          ? "bg-green-100 text-green-700"
                        : section.status === "Not Started"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                          }` }
                        >
                      {section.status}
                    </span>
                    <div >
                      {section.checks.map((check) => (
                      <ProgressItem key={check.name} check={check} />
                      ))}
                    </div>
                  </div>

                    {section.title === "Financial" || section.title === "Credit Check" ? (
                    <div className="mt-3 text-blue-600 text-sm bg-#959DA4">
                      View Details
                    </div>
                    ) : null}
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TenantReferencing;