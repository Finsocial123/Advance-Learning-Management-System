"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Save, User } from "lucide-react";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage, getInitials, getRoleBadgeColor } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/TextArea";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { FullPageSpinner } from "@/components/ui/Spinner";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setPreview(user.avatar_url || null);
    }
  }, [user, isAuthenticated, router]);

  if (!user) return <FullPageSpinner />;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile({ name, bio, avatar });
      setUser(updated);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your personal information
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center">
                {preview ? (
                  <Image
                    src={preview}
                    alt="avatar"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-violet-400">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              >
                <Camera size={13} className="text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <p className="font-semibold text-zinc-100">{user.name}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
              <div className="mt-2">
                <Badge label={user.role} variant="role" />
              </div>
            </div>
          </div>

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed">
              {user.email}
            </div>
            <p className="text-xs text-zinc-600">Email cannot be changed</p>
          </div>

          <Textarea
            label="Bio"
            placeholder="Tell us a little about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />

          <Button type="submit" loading={loading}>
            <Save size={16} />
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}