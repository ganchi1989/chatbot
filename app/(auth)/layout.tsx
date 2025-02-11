import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-7xl flex-1 flex-col">
        <main className=" flex-1 flex-col items-center justify-center">
          {children}
        </main>
      </div>
    </main>
  );
};

export default Layout;
