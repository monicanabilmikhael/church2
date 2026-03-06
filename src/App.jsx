import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

const RANKS = [
  "أبصالتس",
  "أغنسطس",
  "إيبوذياكون",
  "ذياكون",
  "أرشيذياكون",
];

const SERVICE_TYPES = [
  "داخل الهيكل",
  "خارج الهيكل",
  "داخل وخارج الهيكل",
];

const MARITAL_OPTIONS = [
  "أعزب",
  "متزوج",
  "أرمل",
];

const EMPTY = {
  full_name: "",
  date_of_birth: "",
  deacon_rank: "",
  ordination_date: "",
  ordination_title: "",
  ordination_name: "",
  service_type: "",
  confession_father: "",
  marital_status: "",
  profession: "",
  mobile_number: "",
  residence: "",
  notes: "",
};

export default function App() {
  const [deacons, setDeacons] = useState([]);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewDeacon, setViewDeacon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, byRank: {} });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (deacons.length === 0) {
      showToast("لا يوجد بيانات للتصدير", "error");
      return;
    }
    const headers = [
      "م", "الاسم", "تاريخ الميلاد", "الرتبة الشمامسة", "تاريخ السيامة",
      "القائم بالسيامة", "الاسم فى السيامة", "نوع الخدمة",
      "أب الاعتراف", "الحالة الاجتماعية", "المهنة أو الوظيفة",
      "رقم الموبايل", "محل الإقامة", "ملاحظات"
    ];
    const rows = deacons.map((d, i) => [
      i + 1, d.full_name, d.date_of_birth || "", d.deacon_rank || "",
      d.ordination_date || "", d.ordination_title || "", d.ordination_name || "",
      d.service_type || "", d.confession_father || "", d.marital_status || "",
      d.profession || "", d.mobile_number || "", d.residence || "", d.notes || ""
    ]);

    // Build CSV with BOM for Arabic support in Excel
    const BOM = "\uFEFF";
    const csv = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "بيانات_الشمامسة.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("تم تصدير البيانات بنجاح");
  };

  // Print table
  const handlePrint = () => {
    window.print();
  };

  // Fetch deacons
  const fetchDeacons = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("deacons")
      .select("*")
      .order("full_name", { ascending: true });

    if (rankFilter) {
      query = query.eq("deacon_rank", rankFilter);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,ordination_name.ilike.%${search}%,mobile_number.ilike.%${search}%,confession_father.ilike.%${search}%,residence.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      showToast("خطأ في تحميل البيانات: " + error.message, "error");
    } else {
      setDeacons(data || []);
      // Calculate stats
      const total = data?.length || 0;
      const byRank = {};
      (data || []).forEach((d) => {
        const r = d.deacon_rank || "غير محدد";
        byRank[r] = (byRank[r] || 0) + 1;
      });
      setStats({ total, byRank });
    }
    setLoading(false);
  }, [search, rankFilter]);

  useEffect(() => {
    fetchDeacons();
  }, [fetchDeacons]);

  // Create
  const handleCreate = async () => {
    if (!form.full_name.trim()) {
      showToast("الاسم ثلاثي مطلوب", "error");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    // Remove empty strings
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    const { error } = await supabase.from("deacons").insert([payload]);
    setSaving(false);
    if (error) {
      showToast("خطأ: " + error.message, "error");
    } else {
      showToast("تم إضافة الشماس بنجاح ☦");
      setForm(EMPTY);
      setShowForm(false);
      fetchDeacons();
    }
  };

  // Update
  const handleUpdate = async () => {
    if (!form.full_name.trim()) {
      showToast("الاسم ثلاثي مطلوب", "error");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    const { error } = await supabase
      .from("deacons")
      .update(payload)
      .eq("id", editingId);
    setSaving(false);
    if (error) {
      showToast("خطأ: " + error.message, "error");
    } else {
      showToast("تم تعديل البيانات بنجاح ☦");
      setForm(EMPTY);
      setEditingId(null);
      setShowForm(false);
      fetchDeacons();
    }
  };

  // Delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    const { error } = await supabase.from("deacons").delete().eq("id", id);
    if (error) {
      showToast("خطأ في الحذف: " + error.message, "error");
    } else {
      showToast("تم حذف الشماس");
      if (viewDeacon?.id === id) setViewDeacon(null);
      fetchDeacons();
    }
  };

  const openEdit = (d) => {
    setForm({
      full_name: d.full_name || "",
      date_of_birth: d.date_of_birth || "",
      deacon_rank: d.deacon_rank || "",
      ordination_date: d.ordination_date || "",
      ordination_title: d.ordination_title || "",
      ordination_name: d.ordination_name || "",
      service_type: d.service_type || "",
      confession_father: d.confession_father || "",
      marital_status: d.marital_status || "",
      profession: d.profession || "",
      mobile_number: d.mobile_number || "",
      residence: d.residence || "",
      notes: d.notes || "",
    });
    setEditingId(d.id);
    setShowForm(true);
    setViewDeacon(null);
  };

  const closeForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editingId ? handleUpdate() : handleCreate();
  };

  const renderField = (key, label, type = "text") => (
    <div className={`field ${key === "notes" ? "field-full" : ""}`} key={key}>
      <label>{label}</label>
      {key === "deacon_rank" ? (
        <select
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          <option value="">— اختر الرتبة —</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      ) : key === "service_type" ? (
        <select
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          <option value="">— اختر نوع الخدمة —</option>
          {SERVICE_TYPES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      ) : key === "marital_status" ? (
        <select
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          <option value="">— اختر الحالة —</option>
          {MARITAL_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      ) : key === "notes" ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={label}
          rows={2}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={label}
        />
      )}
    </div>
  );

  return (
    <div className="app">
      {/* Background decoration */}
      <div className="bg-pattern" />

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-cross">☦</div>
        <h1>بيانات شمامسة كنيسة العذراء مريم</h1>
        <p className="header-sub">نظام إدارة وحفظ بيانات الشمامسة</p>
        <div className="header-ornament" />
      </header>

      {/* Stats */}
      <section className="stats">
        <div className="stat-card stat-main">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">إجمالي الشمامسة</div>
        </div>
        {RANKS.map((r) => (
          <div className="stat-card" key={r}>
            <div className="stat-value">{stats.byRank[r] || 0}</div>
            <div className="stat-label">{r}</div>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="بحث بالاسم، الموبايل، محل الإقامة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
        >
          <option value="">كل الرتب</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          className="btn btn-add"
          onClick={() => {
            setForm(EMPTY);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <span>+</span> إضافة شماس
        </button>
        <button className="btn btn-excel" onClick={exportToExcel}>
          📊 تصدير Excel
        </button>
        <button className="btn btn-print" onClick={handlePrint}>
          🖨️ طباعة
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="state-msg">
            <div className="spinner" />
            <p>جاري التحميل...</p>
          </div>
        ) : deacons.length === 0 ? (
          <div className="state-msg">
            <div className="empty-icon">📋</div>
            <p>لا يوجد شمامسة مسجلين بعد</p>
            <button className="btn btn-add" onClick={() => setShowForm(true)}>
              + أضف أول شماس
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th>الاسم</th>
                <th>الرتبة</th>
                <th className="hide-mobile">نوع الخدمة</th>
                <th className="hide-mobile">أب الاعتراف</th>
                <th>الموبايل</th>
                <th className="hide-mobile">محل الإقامة</th>
                <th className="th-actions no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {deacons.map((d, i) => (
                <tr key={d.id} onClick={() => setViewDeacon(d)}>
                  <td className="td-num">{i + 1}</td>
                  <td className="td-name">{d.full_name}</td>
                  <td>
                    {d.deacon_rank && (
                      <span className="badge">{d.deacon_rank}</span>
                    )}
                  </td>
                  <td className="hide-mobile">{d.service_type || "—"}</td>
                  <td className="hide-mobile">{d.confession_father || "—"}</td>
                  <td dir="ltr" className="td-phone">{d.mobile_number || "—"}</td>
                  <td className="hide-mobile">{d.residence || "—"}</td>
                  <td
                    className="td-actions no-print"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="icon-btn edit"
                      title="تعديل"
                      onClick={() => openEdit(d)}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn delete"
                      title="حذف"
                      onClick={() => handleDelete(d.id, d.full_name)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "✏️ تعديل بيانات الشماس" : "☦ إضافة شماس جديد"}</h2>
              <button className="close-btn" onClick={closeForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {renderField("full_name", "الاسم ثلاثي *")}
                {renderField("date_of_birth", "تاريخ الميلاد", "date")}
                {renderField("deacon_rank", "الرتبة الشمامسة")}
                {renderField("ordination_date", "تاريخ السيامة", "date")}
                {renderField("ordination_title", "القائم بالسيامة")}
                {renderField("ordination_name", "الاسم فى السيامة")}
                {renderField("service_type", "نوع الخدمة")}
                {renderField("confession_father", "أب الاعتراف")}
                {renderField("marital_status", "الحالة الاجتماعية")}
                {renderField("profession", "المهنة أو الوظيفة")}
                {renderField("mobile_number", "رقم الموبايل", "tel")}
                {renderField("residence", "محل الإقامة")}
                {renderField("notes", "ملاحظات")}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-save" disabled={saving}>
                  {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الشماس"}
                </button>
                <button type="button" className="btn btn-cancel" onClick={closeForm}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewDeacon && (
        <div className="overlay" onClick={() => setViewDeacon(null)}>
          <div className="modal modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>☦ بيانات الشماس</h2>
              <button className="close-btn" onClick={() => setViewDeacon(null)}>✕</button>
            </div>
            <div className="view-content">
              <ViewRow label="الاسم ثلاثي" value={viewDeacon.full_name} highlight />
              <ViewRow label="تاريخ الميلاد" value={viewDeacon.date_of_birth} />
              <ViewRow label="الرتبة" value={viewDeacon.deacon_rank} badge />
              <ViewRow label="تاريخ السيامة" value={viewDeacon.ordination_date} />
              <ViewRow label="القائم بالسيامة" value={viewDeacon.ordination_title} />
              <ViewRow label="الاسم فى السيامة" value={viewDeacon.ordination_name} />
              <ViewRow label="نوع الخدمة" value={viewDeacon.service_type} />
              <ViewRow label="أب الاعتراف" value={viewDeacon.confession_father} />
              <ViewRow label="الحالة الاجتماعية" value={viewDeacon.marital_status} />
              <ViewRow label="المهنة أو الوظيفة" value={viewDeacon.profession} />
              <ViewRow label="رقم الموبايل" value={viewDeacon.mobile_number} dir="ltr" />
              <ViewRow label="محل الإقامة" value={viewDeacon.residence} />
              <ViewRow label="ملاحظات" value={viewDeacon.notes} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-save" onClick={() => openEdit(viewDeacon)}>
                ✏️ تعديل
              </button>
              <button className="btn btn-cancel" onClick={() => setViewDeacon(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-cross">☦</div>
        <p>كنيسة العذراء مريم — نظام إدارة بيانات الشمامسة</p>
      </footer>
    </div>
  );
}

function ViewRow({ label, value, highlight, badge, dir }) {
  return (
    <div className={`view-row ${highlight ? "view-highlight" : ""}`}>
      <span className="view-label">{label}</span>
      <span className="view-value" dir={dir}>
        {badge && value ? (
          <span className="badge">{value}</span>
        ) : (
          value || "—"
        )}
      </span>
    </div>
  );
}

