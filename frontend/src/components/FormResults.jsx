const FormResults = ({ results }) => {

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Form Analysis Results
        </h2>

        <div className="bg-neutral-50 rounded-lg p-6 border-l-4 border-secondary">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
            {results.analysis}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FormResults;
