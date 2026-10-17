import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../icons/arrow-icon";

export function CampusHero() {
  return (
    <section className="home-welcome" aria-labelledby="hero-title">
      <div className="welcome-copy" data-motion-group>
        <Image unoptimized priority className="welcome-mark" src="/images/official-campus-seal.webp" alt="" width={512} height={512} />
        <h1 id="hero-title">空天大学</h1>
        <p>向星辰，向太空。</p>
        <div className="welcome-actions" aria-label="开始创作">
          <Link className="welcome-create welcome-create-character" href="/create/character">创建角色<ArrowIcon /></Link>
          <Link className="welcome-create welcome-create-forum" href="/create/forum">创作论坛体<ArrowIcon /></Link>
        </div>
      </div>
      <div className="welcome-art" aria-hidden="true">
        <Image unoptimized priority src="/images/official-campus-cast.webp" alt="" width={1024} height={768} />
      </div>
    </section>
  );
}
