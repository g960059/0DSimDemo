import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import { Slider } from "@/components/controls/Slider";
import type { ControllerItem } from "@/types";

const sliderItem: ControllerItem = {
  paramKey: "circulation.systemic-vascular-resistance-scale",
  kind: "slider",
  label: "Systemic vascular resistance",
  min: 0.75,
  max: 4 / 3,
  step: 1 / 12,
  options: [
    { label: "0.75×", value: 0.75 },
    { label: "1.00×", value: 1 },
    { label: "1.33×", value: 4 / 3 },
  ],
};

function renderControl(item: ControllerItem, value: number, onChange = vi.fn()) {
  return React.createElement(ControllerItemControl, {
    item,
    value,
    onChange,
  });
}

function collectButtons(node: React.ReactNode): React.ReactElement[] {
  if (!React.isValidElement(node)) return [];
  if (node.type === Slider) return [];
  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => React.ReactNode;
    return collectButtons(Component(node.props));
  }
  const props = node.props as { children?: React.ReactNode };
  const current = typeof node.type === "string" && node.type === "button" ? [node] : [];
  return current.concat(React.Children.toArray(props.children).flatMap(collectButtons));
}

function collectSliders(node: React.ReactNode): React.ReactElement[] {
  if (!React.isValidElement(node)) return [];
  if (node.type === Slider) return [node];
  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => React.ReactNode;
    return collectSliders(Component(node.props));
  }
  const props = node.props as { children?: React.ReactNode };
  return React.Children.toArray(props.children).flatMap(collectSliders);
}

describe("ControllerItemControl", () => {
  it("renders an enumerated slider as exactly three indexed stops", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain("0.75×");
    expect(html).toContain("1.00×");
    expect(html).toContain("1.33×");
    expect(html).toContain('type="range"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="2"');
    expect(html).toContain('step="1"');
    expect(html).toContain('value="1"');
  });

  it("uses the control label on the slider without rendering preset buttons", () => {
    const html = renderToStaticMarkup(renderControl(sliderItem, 1));

    expect(html).toContain('aria-label="Systemic vascular resistance"');
    expect(html).not.toContain('role="group"');
    expect(collectButtons(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange: vi.fn(),
    }))).toHaveLength(0);
  });

  it("passes only the exact runtime values to the indexed slider", () => {
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange: vi.fn(),
    }));
    const sliderProps = sliders[0].props as {
      stops?: readonly { label: string; value: number }[];
    };

    expect(sliderProps.stops?.map(({ value }) => value)).toEqual([
      0.75,
      1,
      4 / 3,
    ]);
  });

  it("forwards drag changes and release commits through separate callbacks", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
      onCommit,
    }));
    const sliderProps = sliders[0].props as {
      onChange?: (v: number) => void;
      onCommit?: (v: number) => void;
    };

    sliderProps.onChange?.(4 / 3);

    expect(onChange).toHaveBeenCalledWith(4 / 3);
    expect(onCommit).not.toHaveBeenCalled();

    sliderProps.onCommit?.(4 / 3);
    expect(onCommit).toHaveBeenCalledWith(4 / 3);
  });

  it("keeps continuous slider drafts local until their release commit", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: { ...sliderItem, options: undefined },
      value: 1,
      onChange,
      onCommit,
    }));
    const sliderProps = sliders[0].props as {
      onChange?: (v: number) => void;
      onCommit?: (v: number) => void;
    };

    expect(sliderProps.onChange).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();

    sliderProps.onCommit?.(1.25);
    expect(onCommit).toHaveBeenCalledWith(1.25);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to onChange when an enumerated slider has no commit callback", () => {
    const onChange = vi.fn();
    const sliders = collectSliders(ControllerItemControl({
      item: sliderItem,
      value: 1,
      onChange,
    }));
    const sliderProps = sliders[0].props as {
      onCommit?: (v: number) => void;
    };

    sliderProps.onCommit?.(0.75);

    expect(onChange).toHaveBeenCalledWith(0.75);
  });

  it("renders pure buttonGroup controls as chips only", () => {
    const html = renderToStaticMarkup(renderControl({ ...sliderItem, kind: "buttonGroup" }, 1));

    expect(html).toContain("0.75×");
    expect(html).toContain("1.00×");
    expect(html).toContain("1.33×");
    expect(html).not.toContain('type="range"');
  });
});
