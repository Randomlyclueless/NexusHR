
const Card = ({ title, children, className = "" }) => {
    return (
        <section
            className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
        >
            {title && (
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {title}
                </h2>
            )}

            {children}
        </section>
    );
};

export default Card;
