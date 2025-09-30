"use client";

import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProfileData {
  age?: number | null;
  dob?: string | null;
  contact?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

// Country data with states/cities
const locationData: Record<string, Record<string, string[]>> = {
  "United States": {
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
  },
  "India": {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
    "Delhi": ["New Delhi", "Delhi Cantonment"],
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham", "Liverpool"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
    "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham"],
  },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton"],
    "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau"],
    "British Columbia": ["Vancouver", "Victoria", "Surrey", "Richmond"],
  },
  "Australia": {
    "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
    "Victoria": ["Melbourne", "Geelong", "Ballarat"],
    "Queensland": ["Brisbane", "Gold Coast", "Cairns"],
  },
};

// Country codes for phone
const countryCodes = [
  { code: "+1", country: "US/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
];

export default function DashboardPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  // Location state
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Phone state
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Age calculation
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [dob, setDob] = useState("");
  
  // Address state
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    // Update states when country changes (but not during initial data load)
    if (selectedCountry && locationData[selectedCountry]) {
      const states = Object.keys(locationData[selectedCountry]);
      setAvailableStates(states);
      // Only reset state/city if they're not valid for the new country
      if (selectedState && !states.includes(selectedState)) {
        setSelectedState("");
        setSelectedCity("");
        setAvailableCities([]);
      }
    } else {
      setAvailableStates([]);
      if (!selectedCountry) {
        setSelectedState("");
        setSelectedCity("");
        setAvailableCities([]);
      }
    }
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    // Update cities when state changes
    if (selectedCountry && selectedState && locationData[selectedCountry]?.[selectedState]) {
      const cities = locationData[selectedCountry][selectedState];
      setAvailableCities(cities);
      // Only reset city if it's not valid for the new state
      if (selectedCity && !cities.includes(selectedCity)) {
        setSelectedCity("");
      }
    } else {
      if (!selectedState) {
        setAvailableCities([]);
        setSelectedCity("");
      }
    }
  }, [selectedState, selectedCountry, selectedCity]);

  useEffect(() => {
    // Calculate age from DOB
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setCalculatedAge(age >= 0 ? age : null);
    } else {
      setCalculatedAge(null);
    }
  }, [dob]);

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        setProfile({});
        setHasProfile(false);
        setIsEditing(true); // Auto-enable editing for first-time setup
        setIsLoadingProfile(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
      setHasProfile(true);
      setIsEditing(false); // Show in view mode if profile exists
      
      // Parse existing data - set country first to populate cascading dropdowns
      if (data.dob) {
        setDob(data.dob);
      }
      
      if (data.address) {
        setAddress(data.address);
      }
      
      // Load location data in correct order for cascading dropdowns
      if (data.country) {
        setSelectedCountry(data.country);
        
        // Populate states for the selected country
        if (locationData[data.country]) {
          const states = Object.keys(locationData[data.country]);
          setAvailableStates(states);
          
          // Set state if available
          if (data.state && states.includes(data.state)) {
            setSelectedState(data.state);
            
            // Populate cities for the selected state
            if (locationData[data.country][data.state]) {
              const cities = locationData[data.country][data.state];
              setAvailableCities(cities);
              
              // Set city if available
              if (data.city && cities.includes(data.city)) {
                setSelectedCity(data.city);
              }
            }
          }
        }
      }
      
      if (data.contact) {
        // Try to extract country code from contact
        const match = data.contact.match(/^(\+\d+)\s*(.+)$/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[2]);
        } else {
          setPhoneNumber(data.contact);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Validate phone number
      if (phoneNumber && !/^\d{7,15}$/.test(phoneNumber.replace(/[\s-]/g, ""))) {
        toast.error("Please enter a valid phone number (7-15 digits)");
        setIsUpdating(false);
        return;
      }
      
      const fullContact = phoneNumber ? `${countryCode} ${phoneNumber}` : null;
      
      const profileData: ProfileData = {
        age: calculatedAge,
        dob: dob || null,
        contact: fullContact,
        address: address || null,
        city: selectedCity || null,
        state: selectedState || null,
        country: selectedCountry || null,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setHasProfile(true);
      setIsEditing(false); // Switch to view mode after saving
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");

    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Signed out successfully!");
      router.push("/");
    }
  };

  if (isPending || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome back, {session.user.name}!
                </h1>
                <p className="text-gray-600 mt-1">{session.user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {!hasProfile ? "Complete Your Profile" : "Profile Details"}
              </h2>
              {hasProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                >
                  Edit Profile
                </button>
              )}
              {hasProfile && isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Reload original data
                  }}
                  className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditing && hasProfile ? (
              // View Mode - Static Display
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                      {profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not provided"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                      {profile.age !== null && profile.age !== undefined ? `${profile.age} years` : "Not calculated"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Location Information</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800">
                        {profile.country || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800">
                        {profile.state || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800">
                        {profile.city || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                    {profile.address || "Not provided"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                    {profile.contact || "Not provided"}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode - Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dob" className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      disabled={isUpdating}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Select your date of birth from the calendar</p>
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
                      Age (Auto-calculated)
                    </label>
                    <input
                      type="text"
                      id="age"
                      name="age"
                      value={calculatedAge !== null ? calculatedAge : ""}
                      readOnly
                      placeholder="Select DOB to auto-calculate"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Automatically calculated from DOB</p>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Location Information</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="group relative">
                      <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition appearance-none cursor-pointer"
                        disabled={isUpdating}
                        required
                      >
                        <option value="">Select Country</option>
                        {Object.keys(locationData).map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                        Select your country from the list
                      </div>
                    </div>

                    <div className="group relative">
                      <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                        State/Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!selectedCountry || isUpdating}
                        required
                      >
                        <option value="">Select State</option>
                        {availableStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                        {selectedCountry ? "Select your state/province" : "Select a country first"}
                      </div>
                    </div>

                    <div className="group relative">
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="city"
                        name="city"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!selectedState || isUpdating}
                        required
                      >
                        <option value="">Select City</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                        {selectedState ? "Select your city" : "Select a state first"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your street address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    disabled={isUpdating}
                  />
                </div>

                {/* Contact Section */}
                <div>
                  <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition cursor-pointer max-w-[140px]"
                      disabled={isUpdating}
                    >
                      {countryCodes.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.flag} {cc.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="contact"
                      name="contact"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="1234567890"
                      pattern="[0-9]{7,15}"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      disabled={isUpdating}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter 7-15 digit phone number without spaces or dashes</p>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating || !calculatedAge}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Saving..." : hasProfile ? "Save Changes" : "Create Profile"}
                </button>
              </form>
            )}
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}