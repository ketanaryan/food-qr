"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, Image as ImageIcon, Save, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  section: string;
  is_available: boolean;
};

export default function MenuBuilder() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("menu").select("*").order("section");
    if (error) toast.error("Failed to load menu");
    else setItems(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file);

    if (error) {
      toast.error("Image upload failed");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.section) {
      toast.error("Name, Price, and Section are required!");
      return;
    }

    // Get auth token to pass to API
    const authHeader = `Basic ${btoa("admin:aryan123")}`;

    if (editingId === "new") {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ action: "insert", data: formData })
      });
      if (!res.ok) toast.error("Failed to add item");
      else toast.success("Item added!");
    } else {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ action: "update", id: editingId, data: formData })
      });
      if (!res.ok) toast.error("Failed to update item");
      else toast.success("Item updated!");
    }
    
    setEditingId(null);
    setFormData({});
    fetchMenu();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const authHeader = `Basic ${btoa("admin:aryan123")}`;
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({ action: "delete", id })
    });
    if (!res.ok) toast.error("Failed to delete item");
    else {
      toast.success("Item deleted!");
      fetchMenu();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Builder</h1>
              <p className="text-gray-500">Manage categories, items, and pricing dynamically.</p>
            </div>
            <button 
              onClick={() => {
                setFormData({ is_available: true, section: "Starters" });
                setEditingId("new");
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20}/> Add New Item
            </button>
          </div>

          {editingId && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 mb-8 animate-in slide-in-from-top-4">
              <h2 className="text-xl font-bold mb-4">{editingId === "new" ? "Create New Item" : "Edit Item"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Paneer Tikka" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Section / Category</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="e.g. Starters, Main Course" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input type="number" className="w-full border rounded-lg p-2" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Original Price (₹) <span className="text-gray-400 font-normal">- For Discounts</span></label>
                  <input type="number" className="w-full border rounded-lg p-2" value={formData.original_price || ''} onChange={e => setFormData({...formData, original_price: parseFloat(e.target.value)})} placeholder="e.g. 250" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea className="w-full border rounded-lg p-2" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Image</label>
                  <div className="flex items-center gap-4">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-400">
                        <ImageIcon />
                      </div>
                    )}
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-sm transition">
                      {uploading ? "Uploading..." : "Upload Image"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"><Save size={18}/> Save Item</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 font-bold text-gray-400">Loading Menu...</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">Item</th>
                    <th className="p-4 font-bold text-gray-600">Section</th>
                    <th className="p-4 font-bold text-gray-600">Price</th>
                    <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={item.image_url || '/menu/default-food.jpg'} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-600">{item.section}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">₹{item.price}</div>
                        {item.original_price && <div className="text-xs text-gray-400 line-through">₹{item.original_price}</div>}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setFormData(item); setEditingId(item.id); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">No items found. Create one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
