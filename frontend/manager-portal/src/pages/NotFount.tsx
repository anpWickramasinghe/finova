import { useNavigate } from 'react-router-dom';
// import Icon from 'components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="flex items-center justify-center w-32 h-32 mx-auto mb-6 rounded-full bg-primary-100">
            {/* <Icon name="FileX" size={64} color="var(--color-primary)" /> */}
          </div>
          <h1 className="mb-4 text-6xl font-bold font-heading text-primary">404</h1>
          <h2 className="mb-2 text-2xl font-semibold font-heading text-text-primary">Page Not Found</h2>
          <p className="mb-8 text-text-secondary">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium text-white rounded-lg bg-primary hover:bg-primary-700 nav-transition"
          >
            {/* <Icon name="Home" size={20} color="white" /> */}
            <span>Go to Dashboard</span>
          </button>

          <button
            onClick={handleGoBack}
            className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium border rounded-lg bg-surface border-border text-text-primary hover:bg-background nav-transition"
          >
            {/* <Icon name="ArrowLeft" size={20} color="var(--color-text-primary)" /> */}
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Section */}
        <div className="p-4 mt-8 rounded-lg bg-primary-50">
          <p className="mb-2 text-sm text-text-secondary">Need help finding what you're looking for?</p>
          <button className="text-sm font-medium text-secondary hover:text-secondary-700 nav-transition">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;