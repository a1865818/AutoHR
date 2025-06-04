// components/apply/SocialProfilesForm.tsx
import { SocialProfiles } from "@/interfaces";

interface SocialProfilesFormProps {
  profiles: SocialProfiles;
  setProfiles: (profiles: SocialProfiles) => void;
}

export function SocialProfilesForm({
  profiles,
  setProfiles,
}: SocialProfilesFormProps) {
  return (
    <div className="bg-white rounded-lg border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Your Profiles
      </h2>
      <p className="text-gray-600 mb-6">Fields marked with * are required.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn
          </label>
          <input
            type="url"
            value={profiles.linkedin}
            onChange={(e) =>
              setProfiles({ ...profiles, linkedin: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facebook
          </label>
          <input
            type="url"
            value={profiles.facebook}
            onChange={(e) =>
              setProfiles({ ...profiles, facebook: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://facebook.com/yourprofile"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            X (fka Twitter)
          </label>
          <input
            type="url"
            value={profiles.twitter}
            onChange={(e) =>
              setProfiles({ ...profiles, twitter: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://x.com/yourhandle"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={profiles.website}
            onChange={(e) =>
              setProfiles({ ...profiles, website: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>
    </div>
  );
}
