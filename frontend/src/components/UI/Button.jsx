const Button = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`px-6 py-2 rounded-lg font-semibold ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
