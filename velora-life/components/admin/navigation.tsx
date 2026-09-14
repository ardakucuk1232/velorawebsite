'use client';

import { sections } from '@/components/admin/config';
import {
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
export function Nav({
  active,
  go,
  pending,
}: {
  active: string;
  go: (id: string) => void;
  pending: number;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <>
      {sections.map((s, i) => (
        <div key={s.id}>
          {(i === 0 || i === 6) && (
            <SidebarGroupLabel className="erp-nav-group">
              {i === 0 ? 'OPERASYON' : 'YÖNETİM'}
            </SidebarGroupLabel>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={active === s.id}
              className="erp-nav-button"
              onClick={() => {
                go(s.id);
                setOpenMobile(false);
              }}
            >
              <s.icon />
              <span>{s.label}</span>
              {s.id === 'orders' && pending > 0 && <b className="erp-nav-count">{pending}</b>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </div>
      ))}
    </>
  );
}
