"use strict";
const common_vendor = require("../../../common/vendor.js");
const utils_request = require("../../../utils/request.js");
const pkgExam_utils_subject = require("../../utils/subject.js");
const utils_constants = require("../../../utils/constants.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "essay-list",
  setup(__props) {
    const subjects = common_vendor.ref([]);
    const selectedSubject = common_vendor.ref(pkgExam_utils_subject.SubjectStorage.get());
    const orgs = common_vendor.ref([]);
    const selectedOrgId = common_vendor.ref(null);
    const chapterEssayGroups = common_vendor.ref([]);
    const loadingOrgs = common_vendor.ref(false);
    const loadingEssays = common_vendor.ref(false);
    const loadingSubjects = common_vendor.ref(false);
    const selectedOrg = common_vendor.computed(() => {
      if (!selectedOrgId.value)
        return null;
      return orgs.value.find((item) => item.id === selectedOrgId.value) || null;
    });
    const ensureSubject = async () => {
      if (!selectedSubject.value) {
        await fetchSubjects();
      }
      return !!selectedSubject.value;
    };
    const syncSubject = (subject) => {
      selectedSubject.value = subject;
      pkgExam_utils_subject.SubjectStorage.set(subject);
    };
    const fetchSubjects = async () => {
      if (loadingSubjects.value)
        return;
      loadingSubjects.value = true;
      try {
        const data = await utils_request.get(utils_constants.API_ENDPOINTS.SUBJECTS.LIST, {}, { showLoading: false });
        const list = (data.subjects || []).map(pkgExam_utils_subject.normalizeSubject);
        subjects.value = list;
        if (!selectedSubject.value && list.length > 0) {
          syncSubject(list[0]);
          return;
        }
        if (selectedSubject.value) {
          const matched = list.find((item) => item.id === selectedSubject.value.id);
          if (matched) {
            syncSubject(matched);
          } else if (list.length > 0) {
            syncSubject(list[0]);
          } else {
            syncSubject(null);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/essay-list/essay-list.vue:142", "获取科目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取科目失败",
          icon: "none"
        });
      } finally {
        loadingSubjects.value = false;
      }
    };
    const fetchSubjectOrgs = async (subjectId) => {
      const data = await utils_request.get(utils_constants.API_ENDPOINTS.ESSAYS.SUBJECT_ORGS(subjectId), {}, { showLoading: false });
      orgs.value = data.orgs || [];
      if (orgs.value.length === 0) {
        selectedOrgId.value = null;
        chapterEssayGroups.value = [];
        return;
      }
      const matched = orgs.value.find((item) => item.id === selectedOrgId.value);
      selectedOrgId.value = matched ? matched.id : orgs.value[0].id;
    };
    const fetchChapterEssays = async () => {
      if (!selectedSubject.value || !selectedOrgId.value) {
        chapterEssayGroups.value = [];
        return;
      }
      loadingEssays.value = true;
      try {
        const subjectId = selectedSubject.value.id;
        const orgId = selectedOrgId.value;
        const data = await utils_request.get(
          utils_constants.API_ENDPOINTS.ESSAYS.SUBJECT_LIST(subjectId),
          { orgId },
          { showLoading: false }
        );
        const essays = data.essays || [];
        const groupedMap = /* @__PURE__ */ new Map();
        essays.forEach((essay) => {
          const chapterId = Number(essay.subject_chapter_id) || 0;
          const chapterName = essay.subject_chapter_name || "未分类章节";
          if (!groupedMap.has(chapterId)) {
            groupedMap.set(chapterId, {
              chapter_id: chapterId,
              chapter_name: chapterName,
              essays: []
            });
          }
          groupedMap.get(chapterId).essays.push(essay);
        });
        chapterEssayGroups.value = Array.from(groupedMap.values());
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/essay-list/essay-list.vue:199", "加载机构论文失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载论文失败",
          icon: "none"
        });
        chapterEssayGroups.value = [];
      } finally {
        loadingEssays.value = false;
      }
    };
    const loadAll = async () => {
      const hasSubject = await ensureSubject();
      if (!hasSubject) {
        chapterEssayGroups.value = [];
        return;
      }
      const subjectId = selectedSubject.value.id;
      loadingOrgs.value = true;
      try {
        await fetchSubjectOrgs(subjectId);
      } finally {
        loadingOrgs.value = false;
      }
      await fetchChapterEssays();
    };
    const selectOrg = async (orgId) => {
      if (selectedOrgId.value === orgId)
        return;
      selectedOrgId.value = orgId;
      await fetchChapterEssays();
    };
    const openSubjectPicker = () => {
      if (!subjects.value.length) {
        common_vendor.index.showToast({
          title: "暂无可选科目",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showActionSheet({
        itemList: subjects.value.map((item) => item.name),
        success: async (res) => {
          const subject = subjects.value[res.tapIndex];
          if (!subject)
            return;
          syncSubject(subject);
          selectedOrgId.value = null;
          await loadAll();
        }
      });
    };
    const openEssayDetail = (essay) => {
      common_vendor.index.navigateTo({
        url: `/pkg-exam/pages/essay-detail/essay-detail?essayId=${essay.id}&essayTitle=${encodeURIComponent(essay.title)}`
      });
    };
    const formatDate = (value) => {
      if (!value)
        return "-";
      const text = String(value);
      if (text.length >= 16) {
        return text.slice(0, 16).replace("T", " ");
      }
      return text.replace("T", " ");
    };
    common_vendor.onShow(async () => {
      const stored = pkgExam_utils_subject.SubjectStorage.get();
      if (stored) {
        selectedSubject.value = stored;
      }
      await fetchSubjects();
      await loadAll();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = selectedSubject.value) == null ? void 0 : _a.name) || "请选择科目"),
        b: common_vendor.t(subjects.value.length ? "切换" : "加载中"),
        c: common_vendor.p({
          type: "arrowdown",
          size: "16",
          color: "#0f766e"
        }),
        d: common_vendor.o(openSubjectPicker),
        e: selectedOrg.value
      }, selectedOrg.value ? {
        f: common_vendor.t(selectedOrg.value.name)
      } : {}, {
        g: loadingOrgs.value
      }, loadingOrgs.value ? {
        h: common_vendor.p({
          type: "spinner-cycle",
          size: "16",
          color: "#0f766e"
        })
      } : orgs.value.length === 0 ? {} : {
        j: common_vendor.f(orgs.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.essay_count || 0),
            c: selectedOrgId.value === item.id ? 1 : "",
            d: item.id,
            e: common_vendor.o(($event) => selectOrg(item.id), item.id)
          };
        })
      }, {
        i: orgs.value.length === 0,
        k: selectedOrg.value
      }, selectedOrg.value ? {
        l: common_vendor.t(selectedOrg.value.name)
      } : {}, {
        m: loadingEssays.value
      }, loadingEssays.value ? {
        n: common_vendor.p({
          type: "spinner-cycle",
          size: "30",
          color: "#0f766e"
        })
      } : chapterEssayGroups.value.length === 0 ? {} : {
        p: common_vendor.f(chapterEssayGroups.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.chapter_name),
            b: common_vendor.t(group.essays.length),
            c: common_vendor.f(group.essays, (essay, k1, i1) => {
              return {
                a: common_vendor.t(essay.title),
                b: common_vendor.t(formatDate(essay.updated_at)),
                c: "b4847376-3-" + i0 + "-" + i1,
                d: essay.id,
                e: common_vendor.o(($event) => openEssayDetail(essay), essay.id)
              };
            }),
            d: group.chapter_id
          };
        }),
        q: common_vendor.p({
          type: "arrowright",
          size: "15",
          color: "#94a3b8"
        })
      }, {
        o: chapterEssayGroups.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b4847376"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pkg-exam/pages/essay-list/essay-list.js.map
