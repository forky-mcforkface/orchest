import { RouteData } from "@/routingConfig";
import React from "react";
import { NavItem } from "./common";

export const useNavTabIndex = ({
  navItems,
  matchRoute,
}: {
  matchRoute: Pick<RouteData, "path" | "root"> | null;
  navItems: NavItem[];
}) => {
  const [navTabIndex, setNavTabIndex] = React.useState(-1);
  const { path, root } = matchRoute || {};

  React.useEffect(() => {
    const newNavTabIndex = navItems.findIndex((item) => {
      const pathWithoutQueryString = item.path.split("?")[0];
      return [path, root].includes(pathWithoutQueryString);
    });
    setNavTabIndex(newNavTabIndex);
  }, [path, root, navItems]);

  return navTabIndex;
};
