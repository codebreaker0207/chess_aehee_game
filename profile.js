const PROFILE_IMAGE_KEY = "aeheeProfileImage";

const setProfileImageSrc = (imgElement, dataUrl) => {
  if (!imgElement) return;
  if (dataUrl) {
    imgElement.src = dataUrl;
    imgElement.classList.add("has-custom-image");
  } else {
    imgElement.src = imgElement.dataset.defaultSrc || imgElement.src;
    imgElement.classList.remove("has-custom-image");
  }
};

const loadStoredProfileImage = () => {
  try {
    return localStorage.getItem(PROFILE_IMAGE_KEY);
  } catch (error) {
    console.error("프로필 이미지를 불러오는 중 오류가 발생했습니다.", error);
    return null;
  }
};

const saveProfileImage = (dataUrl) => {
  try {
    if (dataUrl) {
      localStorage.setItem(PROFILE_IMAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(PROFILE_IMAGE_KEY);
    }
    return true;
  } catch (error) {
    console.error("프로필 이미지를 저장하는 중 오류가 발생했습니다.", error);
    return false;
  }
};

const initializeIndexProfileImage = () => {
  const profileImg = document.getElementById("profileImage");
  if (!profileImg) return;

  if (!profileImg.dataset.defaultSrc) {
    profileImg.dataset.defaultSrc = profileImg.getAttribute("src");
  }

  const storedImage = loadStoredProfileImage();
  if (storedImage) {
    setProfileImageSrc(profileImg, storedImage);
  }
};

const initializeProfileSettingsPage = () => {
  const fileInput = document.getElementById("profileImageInput");
  const previewImg = document.getElementById("profilePreview");
  const saveBtn = document.getElementById("saveProfileImage");
  const resetBtn = document.getElementById("resetProfileImage");
  const statusText = document.getElementById("profileStatus");

  if (!fileInput || !previewImg || !saveBtn || !resetBtn) return;

  if (!previewImg.dataset.defaultSrc) {
    previewImg.dataset.defaultSrc = previewImg.getAttribute("src");
  }

  const updateStatus = (message, type = "info") => {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.className = `profile-status ${type}`;
  };

  const storedImage = loadStoredProfileImage();
  if (storedImage) {
    setProfileImageSrc(previewImg, storedImage);
  }

  fileInput.addEventListener("change", () => {
    const [file] = fileInput.files;
    if (!file) {
      updateStatus("선택된 파일이 없습니다.", "warning");
      return;
    }

    if (!file.type.startsWith("image/")) {
      updateStatus("이미지 파일만 업로드할 수 있습니다.", "error");
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImageSrc(previewImg, reader.result);
      updateStatus("이미지가 미리보기로 적용되었습니다. '저장'을 눌러주세요.", "info");
    };
    reader.onerror = () => {
      updateStatus("이미지를 불러오는 중 오류가 발생했습니다.", "error");
    };
    reader.readAsDataURL(file);
  });

  saveBtn.addEventListener("click", () => {
    const currentSrc = previewImg.getAttribute("src");
    const dataUrl = currentSrc === previewImg.dataset.defaultSrc ? null : currentSrc;
    if (saveProfileImage(dataUrl)) {
      updateStatus("프로필 이미지가 저장되었습니다.", "success");
    } else {
      updateStatus("프로필 이미지를 저장하지 못했습니다.", "error");
    }
  });

  resetBtn.addEventListener("click", () => {
    setProfileImageSrc(previewImg, null);
    fileInput.value = "";
    if (saveProfileImage(null)) {
      updateStatus("기본 프로필 이미지로 초기화되었습니다.", "success");
    }
  });
};

window.addEventListener("DOMContentLoaded", () => {
  initializeIndexProfileImage();
  initializeProfileSettingsPage();
});
