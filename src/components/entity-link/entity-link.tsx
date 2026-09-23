import Link from "next/link";
import { getWikiEntityHref, getWikiEntityLabel, type WikiEntityType } from "../../features/wiki/types";

export function EntityLink({
  type,
  slug,
  label,
}: {
  type: WikiEntityType;
  slug: string;
  label: string;
}) {
  return (
    <Link className="entity-link" href={getWikiEntityHref(type, slug)}>
      <span>{getWikiEntityLabel(type)}</span>
      <strong>{label}</strong>
    </Link>
  );
}
