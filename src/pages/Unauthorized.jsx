const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">403 - Unauthorized</h1>
      <p className="text-lg mt-4">
        You don't have permission to access this page.
      </p>
    </div>
  );
};

export default Unauthorized;