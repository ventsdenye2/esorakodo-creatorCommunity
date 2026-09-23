"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowIcon } from "../../components/icons/arrow-icon";
import { CampusScene, campusStops } from "./campus-scene";

export function CampusLayer() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<(typeof campusStops)[number]["id"]>("archive");
  const selected = campusStops.find((stop) => stop.id === selectedId) ?? campusStops[0];

  function open() {
    setSelectedId("archive");
    dialogRef.current?.showModal();
    requestAnimationFrame(() => closeRef.current?.focus());
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button className="campus-layer-trigger" onClick={open} ref={triggerRef} type="button">
        <span className="campus-layer-symbol" aria-hidden="true">◎</span>
        <span>校园视界</span>
      </button>
      <dialog
        aria-labelledby="campus-layer-title"
        className="campus-layer-dialog"
        onClose={() => triggerRef.current?.focus()}
        ref={dialogRef}
      >
        <div className="campus-layer-shell">
          <div className="campus-layer-heading">
            <div>
              <span>CAMPUS VIEW / STUDY 001</span>
              <h2 id="campus-layer-title">校园视界</h2>
            </div>
            <button aria-label="关闭校园视界" className="campus-layer-close" onClick={close} ref={closeRef} type="button">×</button>
          </div>
          <p className="campus-layer-disclaimer">这是一张空间交互概念图，点位与建筑均非正式校园设定。</p>
          <div className="campus-layer-content">
            <div className="campus-layer-map">
              <CampusScene className="campus-layer-art" />
              {campusStops.map((stop, index) => (
                <button
                  aria-pressed={selectedId === stop.id}
                  className={`campus-map-stop campus-map-stop-${stop.id}`}
                  key={stop.id}
                  onClick={() => setSelectedId(stop.id)}
                  type="button"
                >
                  <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <strong>{stop.label}</strong>
                </button>
              ))}
            </div>
            <aside aria-live="polite" className="campus-layer-sheet">
              <span className="campus-sheet-index">概念点位 / {selectedId.toUpperCase()}</span>
              <h3>{selected.label}</h3>
              <p>{selected.description}</p>
              <Link className="button button-primary" href={selected.href} onClick={close}>打开{selected.label}<ArrowIcon /></Link>
              <div className="campus-sheet-list">
                <span>探索入口</span>
                {campusStops.map((stop) => (
                  <button aria-current={selectedId === stop.id ? "true" : undefined} key={stop.id} onClick={() => setSelectedId(stop.id)} type="button">
                    {stop.label}<ArrowIcon />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </dialog>
    </>
  );
}
