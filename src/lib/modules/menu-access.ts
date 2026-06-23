/** สิทธิ์แสดงโมดูลตาม login_status + where_work (menu.php) */
export function canAccessModule(
  loginStatus: number,
  whereWork: number,
): boolean {
  if (loginStatus === 5 || loginStatus === 15) return false;
  if (loginStatus === 16) return whereWork === 3;

  const isDistrict =
    loginStatus === 99 ||
    (loginStatus >= 2 && loginStatus <= 4) ||
    loginStatus <= 5;

  if (isDistrict && loginStatus !== 5) {
    return whereWork <= 1 || whereWork === 3;
  }

  const isSchool =
    (loginStatus >= 12 && loginStatus <= 14) ||
    (loginStatus > 10 && loginStatus < 16);

  if (isSchool) {
    return whereWork < 1 || whereWork > 1;
  }

  return false;
}

export function isFirstTimeLogin(loginStatus: number): boolean {
  return loginStatus === 5 || loginStatus === 15;
}

export function isDistrictContext(loginStatus: number): boolean {
  return (
    loginStatus === 99 ||
    (loginStatus >= 2 && loginStatus <= 4) ||
    loginStatus === 5
  );
}
