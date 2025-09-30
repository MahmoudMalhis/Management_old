/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accomplishmentsAPI } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LucideArrowLeft,
  LucideLoader,
  LucideFileCheck,
  LucideFileClock,
  LucideCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import ModifyForm from "@/components/ModifyForm";
import AccomplishmentVersionBlock from "@/components/accomplishment/AccomplishmentVersionBlock";
import api from "@/api/api";

const AccomplishmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isManager } = useAuth();
  const { sendAccomplishmentReviewed, sendNewComment } = useSocket();

  const [accomplishment, setAccomplishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState({});

  // ردود (Reply) للتعليقات
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [galleryFolders, setGalleryFolders] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [folderName, setFolderName] = useState("__NEW__");
  const [newFolderName, setNewFolderName] = useState("");
  const [showStartForm, setShowStartForm] = useState(false);

  const fetchAccomplishment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accomplishmentsAPI.getAccomplishment(id!);
      setAccomplishment(response.data);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccomplishment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // تحديث حالة الإنجاز بعد المراجعة
  const handleReviewAccomplishment = async (status: string) => {
    try {
      setReviewing(true);
      await accomplishmentsAPI.reviewAccomplishment(id!, status);
      await fetchAccomplishment();
      sendAccomplishmentReviewed(id!, accomplishment!.employee._id);
      if (status === "reviewed") {
        toast(t("common.success"), {
          icon: <CheckCircle color="green" />,
          description: t("accomplishments.reviewedSuccess"), // استخدم نص مخصص لو عندك
        });
      } else if (status === "needs_modification") {
        toast(t("accomplishments.needsModification"), {
          icon: <AlertTriangle color="red" />,

          description: t("accomplishments.modificationRequested"),
        });
      }
    } finally {
      setReviewing(false);
    }
  };
  const allFiles = accomplishment
    ? [
        ...(accomplishment?.files || []),
        ...(Array.isArray(accomplishment.previousVersions)
          ? accomplishment.previousVersions
          : []
        ).flatMap((v) => v.files || []),
      ]
    : [];

  // عند الضغط على تم للمراجعة، افتح الـ popup
  const openGalleryPopup = async () => {
    if (!allFiles || allFiles.length === 0) {
      return;
    }
    const res = await api.get("/gallery/folders");
    setGalleryFolders(res.data.folders);
    setShowGalleryPopup(true);
  };

  const handleSaveToGallery = async () => {
    await api.post("/gallery/add-files", {
      files: selectedFiles,
      folderName: folderName === "__NEW__" ? newFolderName : folderName,
    });
    setShowGalleryPopup(false);
    toast(t("gallery.addedToGallery"), {
      icon: <CheckCircle color="green" />,
    });
  };

  const canCurrentUserReply = (comment) => {
    return true;
  };

  const handleAddComment = async (
    e: React.FormEvent,
    displayIdx: number,
    versionIdx: number
  ) => {
    e.preventDefault();
    const text = commentText[displayIdx] || "";
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const response = await accomplishmentsAPI.addComment(
        id!,
        text,
        versionIdx
      );
      setAccomplishment(response.data);
      setCommentText((prev) => ({ ...prev, [displayIdx]: "" }));
      try {
        toast(t("common.success"), {
          description:
            t("accomplishments.addComment") +
            " " +
            t("common.success").toLowerCase(),
        });
      } catch (err) {
        toast(t("common.error"), {
          description: err.message || t("common.error"),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // إرسال الرد على التعليق
  const handleReplySubmit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      const response = await accomplishmentsAPI.replyToComment(
        id!,
        commentId,
        replyText
      );
      setAccomplishment(response.data);
      setReplyText("");
      setReplyTo(null);
      try {
        toast(t("common.success"), {
          description:
            t("accomplishments.reply") +
            " " +
            t("common.success").toLowerCase(),
        });
      } catch (err) {
        toast(t("common.error"), {
          description: err.message || t("common.error"),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // تجهيز جميع الإصدارات (النسخ السابقة + الحالية)
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LucideLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error || !accomplishment) {
    return (
      <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
        <CardContent className="flex items-center justify-between py-6">
          <span className="text-red-600 dark:text-red-400">
            {error || t("common.error")}
          </span>
          <Button
            variant="outline"
            onClick={() => navigate("/accomplishments")}
          >
            {t("common.back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // بناء جميع الإصدارات
  const versions = [
    ...(accomplishment.previousVersions || []),
    {
      description: accomplishment.description,
      files: accomplishment.files,
      modifiedAt:
        accomplishment.lastContentModifiedAt || accomplishment.createdAt,
      _id: "current",
    },
  ];

  const displayVersions = [...versions].reverse();
  const allReplies = accomplishment.comments.filter((c) => c.isReply);
  function getLastModifiedDate(acc) {
    return acc.lastContentModifiedAt || acc.createdAt;
  }
  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() => navigate("/accomplishments")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>
      <Card className="glass-card border-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl glassy-text">
                {isManager && (
                  <div className="mb-1 font-medium capitalize">
                    {accomplishment.employee.name}
                  </div>
                )}
                <span className="text-muted-foreground text-sm">
                  {new Date(
                    getLastModifiedDate(accomplishment)
                  ).toLocaleString()}
                </span>
              </CardTitle>
            </div>
            <Badge
              variant={
                accomplishment.status === "reviewed" ? "default" : "outline"
              }
              className={
                accomplishment.status === "reviewed"
                  ? "glass-badge bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : accomplishment.status === "needs_modification"
                  ? "glass-badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "glass-badge bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }
            >
              {accomplishment.status === "reviewed" ? (
                <span className="flex items-center gap-1">
                  <LucideFileCheck className="h-3 w-3" />
                  {t("accomplishments.reviewed")}
                </span>
              ) : accomplishment.status === "needs_modification" ? (
                <span className="flex items-center gap-1">
                  <LucideFileClock className="h-3 w-3" />
                  {t("accomplishments.needsModification")}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <LucideFileClock className="h-3 w-3" />
                  {t("accomplishments.notReviewed")}
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* وصف وملفات المدير الأصلية */}
          {accomplishment.originalDescription && (
            <Card className="mb-4 p-4 border border-blue-200 bg-blue-50">
              <div className="font-bold mb-2 text-blue-800">
                {t("accomplishments.originalManagerDescription")}
              </div>

              <div className="mb-3">{accomplishment.originalDescription}</div>

              {Array.isArray(accomplishment.originalFiles) &&
                accomplishment.originalFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {accomplishment.originalFiles.map((file, idx) => {
                      // base url (لو بتخزن مسار نسبي)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const BASE_URL: string =
                        (import.meta as any).env?.VITE_API_URL ||
                        "http://localhost:5000";

                      const filePath = file.filePath?.startsWith("http")
                        ? file.filePath
                        : `${BASE_URL}${file.filePath || ""}`;

                      const fileName =
                        file.fileName || filePath.split("/").pop() || "file";
                      const mime = file.fileType || "";

                      const isImage =
                        mime.startsWith("image/") ||
                        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);

                      return isImage ? (
                        // صورة: مصغّرة قابلة للفتح
                        <a
                          key={idx}
                          href={filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                          title={fileName}
                        >
                          <img
                            src={filePath}
                            alt={fileName}
                            className="h-32 w-32 object-cover rounded-2xl shadow border border-white/30"
                            style={{
                              background: "rgba(255,255,255,0.18)",
                              backdropFilter: "blur(3px)",
                            }}
                          />
                        </a>
                      ) : (
                        // ملف غير صورة: بطاقة فيها أيقونة + الاسم + رابط
                        <a
                          key={idx}
                          href={filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/30 shadow glass-card"
                          title={fileName}
                          download={fileName}
                          style={{
                            background: "rgba(255,255,255,0.16)",
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          {/* أيقونة ملف بسيطة */}
                          <svg
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            aria-hidden="true"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 2v6h6"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-sm max-w-[180px] truncate">
                            {fileName}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
            </Card>
          )}

          {/* جميع الإصدارات */}
          {accomplishment.status !== "assigned" &&
            displayVersions.map((version, idx) => {
              const originalIdx = versions.length - 1 - idx;
              return (
                <AccomplishmentVersionBlock
                  key={version._id + version.modifiedAt}
                  version={version}
                  sectionComments={accomplishment.comments
                    .filter(
                      (c) =>
                        !c.isReply &&
                        (c.versionIndex === originalIdx ||
                          (originalIdx === versions.length - 1 &&
                            c.versionIndex === undefined))
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    )}
                  sectionReplies={allReplies.filter((reply) =>
                    accomplishment.comments
                      .filter(
                        (c) =>
                          !c.isReply &&
                          (c.versionIndex === originalIdx ||
                            (originalIdx === versions.length - 1 &&
                              c.versionIndex === undefined))
                      )
                      .some((comment) => comment._id === reply.replyTo)
                  )}
                  idx={idx}
                  total={displayVersions.length}
                  t={t}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  submitting={submitting}
                  handleReplySubmit={handleReplySubmit}
                  canAddComment={
                    (user?._id === accomplishment.employee._id || isManager) &&
                    originalIdx === versions.length - 1
                  }
                  commentText={commentText}
                  setCommentText={setCommentText}
                  handleAddComment={(e) =>
                    handleAddComment(e, idx, originalIdx)
                  }
                  canReply={canCurrentUserReply}
                  accomplishmentStatus={accomplishment.status}
                />
              );
            })}

          {accomplishment.status === "assigned" &&
            user?._id === accomplishment.employee._id &&
            (!showStartForm ? (
              <Button
                className="mt-4 glass-btn"
                onClick={() => setShowStartForm(true)}
              >
                {t("accomplishments.startTask")}
              </Button>
            ) : (
              <ModifyForm
                accomplishmentId={accomplishment._id}
                oldDescription="" // يبدأ فارغاً لأن وصف المدير سيظهر في النسخ السابقة
                oldFiles={[]} // يبدأ فارغاً
                onModified={async () => {
                  setShowStartForm(false);
                  await fetchAccomplishment();
                }}
                mode="start"
              />
            ))}

          {/* أزرار المراجعة (فقط للمدير) */}
          {accomplishment.status !== "assigned" && (
            <div className="flex justify-between">
              {isManager && accomplishment.status !== "reviewed" && (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => handleReviewAccomplishment("reviewed")}
                    disabled={reviewing}
                    className="flex items-center gap-2 glass-btn"
                  >
                    {reviewing ? (
                      <LucideLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <LucideCheck className="h-4 w-4" />
                    )}
                    {t("accomplishments.review")}
                  </Button>
                  <Button
                    onClick={() =>
                      handleReviewAccomplishment("needs_modification")
                    }
                    variant="outline"
                    disabled={reviewing}
                    className="flex items-center gap-2 glass-btn"
                  >
                    {reviewing ? (
                      <LucideLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <LucideCheck className="h-4 w-4" />
                    )}
                    {t("accomplishments.needsModification")}
                  </Button>
                </div>
              )}
              {isManager && allFiles.length !== 0 && (
                <Button
                  onClick={openGalleryPopup}
                  variant="outline"
                  className="flex items-center gap-2 glass-btn"
                >
                  {t("gallery.addToGallery")}
                </Button>
              )}
            </div>
          )}
          {/* زر تعديل الإنجاز */}
          {accomplishment.status === "needs_modification" &&
            user?._id === accomplishment.employee._id && (
              <ModifyForm
                accomplishmentId={accomplishment._id}
                oldDescription={accomplishment.description}
                onModified={fetchAccomplishment}
              />
            )}
        </CardContent>
      </Card>
      <>
        {showGalleryPopup && accomplishment && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <div className="glass-popup rounded-2xl p-6 min-w-[320px] max-w-md shadow-xl border ">
              <h2 className="mb-4 font-bold glassy-text">
                {t("gallery.selectFiles")}
              </h2>
              <div className="max-h-96 overflow-auto">
                {(allFiles || []).map((file, i) => (
                  <div key={i} className="flex mt-3">
                    <input
                      type="checkbox"
                      checked={
                        !!file.filePath &&
                        selectedFiles.some((f) => f.filePath === file.filePath)
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedFiles([
                            ...selectedFiles,
                            {
                              ...file,
                              fromAccomplishment: accomplishment._id,
                            },
                          ]);
                        else
                          setSelectedFiles(
                            selectedFiles.filter(
                              (f) => f.filePath !== file.filePath
                            )
                          );
                      }}
                    />
                    <img
                      src={file.filePath}
                      alt=""
                      className="w-28 mr-3 rounded-xl shadow border border-white/30"
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(4px)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="block mb-1 glassy-text">
                  {t("gallery.selectFolder")}
                </label>
                <select
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="glass-input border p-1 w-full capitalize"
                >
                  <option value="__NEW__">
                    -- {t("gallery.newFolder")} --
                  </option>
                  {(galleryFolders || []).map((f) => (
                    <option key={f._id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {folderName === "__NEW__" && (
                  <input
                    type="text"
                    className="mt-2 glass-input border p-1 w-full"
                    placeholder={t("gallery.newFolderName")}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                )}
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  onClick={() => setShowGalleryPopup(false)}
                  variant="outline"
                  className="glass-btn"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSaveToGallery}
                  disabled={selectedFiles.length === 0 || !folderName}
                  className="glass-btn"
                >
                  {t("common.done")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default AccomplishmentDetails;
