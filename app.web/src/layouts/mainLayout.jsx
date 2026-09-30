import { useState } from "react";
import { Text } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { AppNav } from "../components/appNav";
import { TopNavBar } from "../components/topNavBar";
import { useAppShell } from "../context/appShellContext";
import { getMainLayoutThemeStyles, useMainLayoutStyles } from "../styles/layouts/mainLayoutStyles";

function MainLayout() {
  const styles = useMainLayoutStyles();
  const { t } = useTranslation();
  const { locale, userName } = useAppShell();
  const [navOpen, setNavOpen] = useState(true);
  const themeStyles = getMainLayoutThemeStyles();

  return (
    <div className={styles.root} style={themeStyles.root}>
      <TopNavBar navOpen={navOpen} onToggleNav={() => setNavOpen((current) => !current)} />

      <div className={styles.shell}>
        <aside
          className={navOpen ? styles.sidebar : `${styles.sidebar} ${styles.sidebarHidden}`}
          style={themeStyles.sidebar}
        >
          {navOpen ? <AppNav locale={locale} /> : null}
        </aside>

        <div className={styles.mainColumn}>
          <div className={styles.userStrip}>
            <Text style={themeStyles.userLabel}>{t("userLabel")}:</Text>
            <Text className={styles.userStripValue} style={themeStyles.userValue}>
              {userName || "-"}
            </Text>
          </div>

          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
