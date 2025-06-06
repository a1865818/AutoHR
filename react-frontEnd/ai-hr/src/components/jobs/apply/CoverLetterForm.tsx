interface CoverLetterFormProps {
  coverLetter: string;
  setCoverLetter: (letter: string) => void;
}

export function CoverLetterForm({
  coverLetter,
  setCoverLetter,
}: CoverLetterFormProps) {
  return (
    <div className="bg-white rounded-lg border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Message to the Hiring Team
      </h2>
      <p className="text-gray-600 mb-6">
        Let the company know about your interest working there
      </p>

      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows={8}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="Write your cover letter here..."
      />
    </div>
  );
}
