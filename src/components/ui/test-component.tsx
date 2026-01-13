import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Custom Book Icon SVG Component
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="15"
    viewBox="0 0 16 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14.8 0.775111C14.4252 0.461731 13.986 0.234705 13.5137 0.110155C13.0413 -0.0143957 12.5472 -0.0334158 12.0667 0.0544447L9.51867 0.517111C8.9304 0.62514 8.39553 0.927795 8 1.37644C7.60344 0.92702 7.06704 0.624297 6.47733 0.517111L3.93333 0.0544447C3.45277 -0.0334927 2.95875 -0.0147219 2.48625 0.109429C2.01375 0.233579 1.57431 0.460074 1.19904 0.77288C0.823778 1.08569 0.521857 1.47716 0.314655 1.91958C0.107452 2.36201 3.25416e-05 2.84457 0 3.33311L0 10.5284C3.83039e-05 11.309 0.273984 12.0647 0.774089 12.664C1.27419 13.2633 1.96874 13.6681 2.73667 13.8078L6.92733 14.5698C7.63664 14.6987 8.36336 14.6987 9.07267 14.5698L13.2667 13.8078C14.034 13.6674 14.7278 13.2623 15.2272 12.6631C15.7266 12.0639 16.0001 11.3085 16 10.5284V3.33311C16.0003 2.84474 15.8929 2.36231 15.6855 1.92017C15.4781 1.47804 15.1758 1.08707 14.8 0.775111V0.775111ZM7.33333 13.2851C7.27733 13.2771 7.22133 13.2678 7.16533 13.2578L2.97533 12.4964C2.51451 12.4126 2.09773 12.1697 1.79766 11.81C1.49759 11.4504 1.33326 10.9968 1.33333 10.5284V3.33311C1.33333 2.80268 1.54405 2.29397 1.91912 1.9189C2.29419 1.54382 2.8029 1.33311 3.33333 1.33311C3.45406 1.3334 3.57453 1.34433 3.69333 1.36578L6.24 1.83244C6.54641 1.88851 6.82352 2.05009 7.02323 2.28914C7.22294 2.52819 7.33266 2.82962 7.33333 3.14111V13.2851ZM14.6667 10.5284C14.6667 10.9968 14.5024 11.4504 14.2023 11.81C13.9023 12.1697 13.4855 12.4126 13.0247 12.4964L8.83467 13.2578C8.77867 13.2678 8.72267 13.2771 8.66667 13.2851V3.14111C8.66662 2.82885 8.77617 2.52648 8.97622 2.28672C9.17626 2.04695 9.45412 1.88501 9.76133 1.82911L12.3087 1.36244C12.5971 1.30996 12.8936 1.32155 13.1771 1.39638C13.4606 1.47122 13.7242 1.60748 13.9492 1.79551C14.1742 1.98355 14.3551 2.21875 14.4791 2.48446C14.6031 2.75017 14.6671 3.0399 14.6667 3.33311V10.5284Z"
      fill="currentColor"
    />
  </svg>
);

// Custom Bookmark Icon SVG Component
const BookmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="15"
    height="16"
    viewBox="0 0 15 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12.7581 16C12.5115 15.9993 12.2674 15.9498 12.04 15.8542C11.8127 15.7587 11.6065 15.619 11.4334 15.4433L7.33341 11.3673L3.23342 15.446C2.9701 15.7132 2.63241 15.8948 2.26436 15.9672C1.89631 16.0396 1.51498 15.9995 1.17008 15.852C0.82176 15.7119 0.523779 15.47 0.315054 15.1579C0.106329 14.8459 -0.0034395 14.4781 8.21575e-05 14.1027V3.33333C8.21575e-05 2.44928 0.351272 1.60143 0.976393 0.976311C1.60151 0.351189 2.44936 0 3.33342 0L11.3334 0C11.7712 0 12.2046 0.0862192 12.609 0.253735C13.0134 0.421251 13.3809 0.666782 13.6904 0.976311C14 1.28584 14.2455 1.6533 14.413 2.05772C14.5805 2.46214 14.6667 2.89559 14.6667 3.33333V14.1027C14.6705 14.4778 14.5611 14.8453 14.3529 15.1574C14.1447 15.4694 13.8472 15.7115 13.4994 15.852C13.2646 15.9502 13.0126 16.0005 12.7581 16ZM3.33342 1.33333C2.80298 1.33333 2.29427 1.54405 1.9192 1.91912C1.54413 2.29419 1.33342 2.8029 1.33342 3.33333V14.1027C1.33317 14.2138 1.36586 14.3224 1.42735 14.4149C1.48884 14.5075 1.57636 14.5797 1.67888 14.6225C1.78139 14.6653 1.89429 14.6768 2.00331 14.6554C2.11233 14.6341 2.21259 14.5809 2.29142 14.5027V14.5027L6.86675 9.95533C6.99166 9.83117 7.16062 9.76147 7.33675 9.76147C7.51287 9.76147 7.68184 9.83117 7.80675 9.95533L12.3767 14.5013C12.4556 14.5796 12.5558 14.6328 12.6649 14.6541C12.7739 14.6754 12.8868 14.664 12.9893 14.6212C13.0918 14.5784 13.1793 14.5061 13.2408 14.4136C13.3023 14.3211 13.335 14.2124 13.3347 14.1013V3.33333C13.3347 2.8029 13.124 2.29419 12.749 1.91912C12.3739 1.54405 11.8652 1.33333 11.3347 1.33333H3.33342Z"
      fill="currentColor"
    />
  </svg>
);

// Custom Verification Badge Icon SVG Component
const VerificationBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="21"
    viewBox="0 0 18 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14.5084 1.87271L9.0265 0.0448357C8.84702 -0.0149452 8.65299 -0.0149452 8.4735 0.0448357L2.99163 1.87271C2.12004 2.16223 1.36186 2.71906 0.824815 3.46408C0.287765 4.2091 -0.000841465 5.10442 1.84285e-06 6.02284V10.5002C1.84285e-06 17.1178 8.05 20.7727 8.39475 20.925C8.50659 20.9746 8.62762 21.0003 8.75 21.0003C8.87239 21.0003 8.99341 20.9746 9.10525 20.925C9.45 20.7727 17.5 17.1178 17.5 10.5002V6.02284C17.5008 5.10442 17.2122 4.2091 16.6752 3.46408C16.1381 2.71906 15.38 2.16223 14.5084 1.87271V1.87271ZM12.8783 8.50259L9.14025 12.2406C8.98729 12.3946 8.80526 12.5166 8.60473 12.5997C8.4042 12.6828 8.18918 12.7252 7.97213 12.7245H7.94325C7.72178 12.7211 7.5033 12.6728 7.30102 12.5826C7.09873 12.4923 6.91685 12.362 6.76638 12.1995L4.74863 10.0995C4.66124 10.0184 4.59134 9.92031 4.54322 9.81125C4.4951 9.70219 4.46977 9.58445 4.46879 9.46526C4.4678 9.34606 4.49118 9.22791 4.53749 9.11807C4.5838 9.00824 4.65207 8.90902 4.7381 8.82651C4.82413 8.744 4.92612 8.67994 5.03779 8.63826C5.14947 8.59657 5.26849 8.57815 5.38754 8.58412C5.5066 8.59008 5.62317 8.62031 5.73013 8.67295C5.83708 8.72558 5.93215 8.79952 6.0095 8.89021L7.973 10.9377L11.6375 7.26271C11.8025 7.10332 12.0236 7.01513 12.253 7.01712C12.4824 7.01912 12.7019 7.11114 12.8641 7.27337C13.0263 7.4356 13.1183 7.65506 13.1203 7.88449C13.1223 8.11391 13.0341 8.33493 12.8748 8.49996L12.8783 8.50259Z"
      fill="currentColor"
    />
  </svg>
);

// Custom Button Icon SVG Component (Notebook/Calendar)
const ButtonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="12"
    height="16"
    viewBox="0 0 12 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10.6667 2.01467C10.6667 2.00933 10.6667 2.00533 10.6667 2V0.666667C10.6667 0.489856 10.5964 0.320286 10.4714 0.195262C10.3464 0.0702379 10.1768 0 10 0C9.82319 0 9.65362 0.0702379 9.5286 0.195262C9.40357 0.320286 9.33333 0.489856 9.33333 0.666667V1.4C9.11391 1.35544 8.89056 1.33311 8.66667 1.33333H8V0.666667C8 0.489856 7.92976 0.320286 7.80474 0.195262C7.67971 0.0702379 7.51014 0 7.33333 0C7.15652 0 6.98695 0.0702379 6.86193 0.195262C6.7369 0.320286 6.66667 0.489856 6.66667 0.666667V1.33333H5.33333V0.666667C5.33333 0.489856 5.2631 0.320286 5.13807 0.195262C5.01305 0.0702379 4.84348 0 4.66667 0C4.48986 0 4.32029 0.0702379 4.19526 0.195262C4.07024 0.320286 4 0.489856 4 0.666667V1.33333H3.33333C3.10944 1.33311 2.88609 1.35544 2.66667 1.4V0.666667C2.66667 0.489856 2.59643 0.320286 2.4714 0.195262C2.34638 0.0702379 2.17681 0 2 0C1.82319 0 1.65362 0.0702379 1.5286 0.195262C1.40357 0.320286 1.33333 0.489856 1.33333 0.666667V2C1.33333 2.00533 1.33333 2.00933 1.33333 2.01467C0.920523 2.32292 0.585132 2.72303 0.35371 3.18332C0.122288 3.64362 0.00118955 4.15147 0 4.66667V12.6667C0.00105857 13.5504 0.352588 14.3976 0.97748 15.0225C1.60237 15.6474 2.4496 15.9989 3.33333 16H8.66667C9.5504 15.9989 10.3976 15.6474 11.0225 15.0225C11.6474 14.3976 11.9989 13.5504 12 12.6667V4.66667C11.9988 4.15147 11.8777 3.64362 11.6463 3.18332C11.4149 2.72303 11.0795 2.32292 10.6667 2.01467V2.01467ZM10.6667 12.6667C10.6667 13.1971 10.456 13.7058 10.0809 14.0809C9.70581 14.456 9.1971 14.6667 8.66667 14.6667H3.33333C2.8029 14.6667 2.29419 14.456 1.91912 14.0809C1.54405 13.7058 1.33333 13.1971 1.33333 12.6667V4.66667C1.33333 4.13623 1.54405 3.62753 1.91912 3.25245C2.29419 2.87738 2.8029 2.66667 3.33333 2.66667H8.66667C9.1971 2.66667 9.70581 2.87738 10.0809 3.25245C10.456 3.62753 10.6667 4.13623 10.6667 4.66667V12.6667ZM9.33333 5.33333C9.33333 5.51014 9.2631 5.67971 9.13807 5.80474C9.01305 5.92976 8.84348 6 8.66667 6H3.33333C3.15652 6 2.98695 5.92976 2.86193 5.80474C2.7369 5.67971 2.66667 5.51014 2.66667 5.33333C2.66667 5.15652 2.7369 4.98695 2.86193 4.86193C2.98695 4.7369 3.15652 4.66667 3.33333 4.66667H8.66667C8.84348 4.66667 9.01305 4.7369 9.13807 4.86193C9.2631 4.98695 9.33333 5.15652 9.33333 5.33333ZM9.33333 8C9.33333 8.17681 9.2631 8.34638 9.13807 8.4714C9.01305 8.59643 8.84348 8.66667 8.66667 8.66667H3.33333C3.15652 8.66667 2.98695 8.59643 2.86193 8.4714C2.7369 8.34638 2.66667 8.17681 2.66667 8C2.66667 7.82319 2.7369 7.65362 2.86193 7.5286C2.98695 7.40357 3.15652 7.33333 3.33333 7.33333H8.66667C8.84348 7.33333 9.01305 7.40357 9.13807 7.5286C9.2631 7.65362 9.33333 7.82319 9.33333 8ZM6.66667 10.6667C6.66667 10.8435 6.59643 11.013 6.4714 11.1381C6.34638 11.2631 6.17681 11.3333 6 11.3333H3.33333C3.15652 11.3333 2.98695 11.2631 2.86193 11.1381C2.7369 11.013 2.66667 10.8435 2.66667 10.6667C2.66667 10.4899 2.7369 10.3203 2.86193 10.1953C2.98695 10.0702 3.15652 10 3.33333 10H6C6.17681 10 6.34638 10.0702 6.4714 10.1953C6.59643 10.3203 6.66667 10.4899 6.66667 10.6667Z"
      fill="currentColor"
    />
  </svg>
);

const testComponentVariants = cva(
  "flex flex-col w-full",
  {
    variants: {
      primaryVertical: {
        default: "",
        // Add more variants here as needed
        // Example: compact: "gap-2", spaced: "gap-8"
      },
    },
    defaultVariants: {
      primaryVertical: "default",
    },
  }
);

export interface TestComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof testComponentVariants> {
  /**
   * Image source URL for the component
   */
  imageSrc?: string;
  /**
   * Alt text for the image
   */
  imageAlt?: string;
  /**
   * Title text displayed in the component
   */
  title?: string;
  /**
   * Whether to show the verification badge
   */
  verified?: boolean;
  /**
   * Description text displayed below the title
   */
  description?: string;
  /**
   * Number of books/readings
   */
  bookCount?: number;
  /**
   * Number of bookmarks
   */
  bookmarkCount?: number;
  /**
   * Button text
   */
  buttonText?: string;
  /**
   * Button click handler
   */
  onButtonClick?: () => void;
}

const TestComponent = React.forwardRef<HTMLDivElement, TestComponentProps>(
  (
    {
      className,
      primaryVertical,
      imageSrc,
      imageAlt = "Component image",
      title = "Test Component",
      verified = true,
      description = "This is a test component to try out a new workflow. Hope it works",
      bookCount = 10,
      bookmarkCount = 567,
      buttonText = "Component Button",
      onButtonClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(testComponentVariants({ primaryVertical, className }))}
        {...props}
      >
        {/* Image Section */}
        <div className="h-[306px] relative rounded-[32px] shrink-0 w-full overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="absolute inset-0 max-w-none object-cover object-center pointer-events-none rounded-[32px] w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-[32px]" />
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
          {/* Title and Description */}
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            {/* Title with Verification Badge */}
            <div className="flex gap-[5px] items-center relative shrink-0">
              <p className="font-archivo font-medium leading-normal relative shrink-0 text-[#374957] text-[18px]">
                {title}
              </p>
              {verified && (
                <div className="relative shrink-0 w-[18px] h-[21px] text-[#4da41a]">
                  <VerificationBadgeIcon className="w-full h-full" />
                </div>
              )}
            </div>
            {/* Description */}
            <p className="font-archivo font-medium leading-normal min-w-full relative shrink-0 text-[#526370] text-[12px]">
              {description}
            </p>
          </div>

          {/* Stats and Button Section */}
          <div className="flex gap-[12px] items-center relative shrink-0 w-full">
            {/* Stats */}
            <div className="basis-0 flex gap-[14px] grow items-center justify-start min-h-px min-w-px relative shrink-0">
              {/* Book Count */}
              <div className="flex gap-[6px] items-center relative shrink-0">
                <div className="relative shrink-0 w-4 h-4 text-[#f14536]">
                  <BookIcon className="w-full h-full" />
                </div>
                <p className="font-archivo font-medium leading-normal relative shrink-0 text-[#526370] text-[14px] whitespace-nowrap">
                  {bookCount}
                </p>
              </div>
              {/* Bookmark Count */}
              <div className="flex gap-[6px] items-center relative shrink-0">
                <div className="relative shrink-0 w-4 h-4 text-[#2f7db0]">
                  <BookmarkIcon className="w-full h-full" />
                </div>
                <p className="font-archivo font-medium leading-normal relative shrink-0 text-[#526370] text-[14px] whitespace-nowrap">
                  {bookmarkCount}
                </p>
              </div>
            </div>
            {/* Button */}
            <button
              onClick={onButtonClick}
              className="bg-[#f1f1f1] flex gap-[8px] items-center px-[16px] py-[12px] relative rounded-[128px] shrink-0 hover:bg-[#e1e1e1] transition-colors"
            >
              <div className="relative shrink-0 w-3 h-4 text-[#374957]">
                <ButtonIcon className="w-full h-full" />
              </div>
              <p className="font-archivo font-medium leading-normal relative shrink-0 text-[#374957] text-[12px] whitespace-nowrap">
                {buttonText}
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

TestComponent.displayName = "TestComponent";

export { TestComponent, testComponentVariants };

