/** Maps legacy position_code + org type → login_status (login_chk.php). */
export function districtLoginStatus(positionCode: number): number {
  if (positionCode === 1) return 2;
  if (positionCode === 2) return 3;
  return 4;
}

export function schoolLoginStatus(positionCode: number): number {
  if (positionCode === 1) return 12;
  if (positionCode === 2) return 13;
  return 14;
}
