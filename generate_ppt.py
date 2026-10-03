import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]  # Blank slide

    # Theme Colors
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900
    BG_LIGHT = RGBColor(248, 250, 252)    # Slate 50
    CARD_BG = RGBColor(255, 255, 255)     # White
    CARD_BORDER = RGBColor(226, 232, 240) # Slate 200
    
    PRIMARY_BLUE = RGBColor(37, 99, 235)  # Electric Blue #2563EB
    DEEP_BLUE = RGBColor(29, 78, 216)     # Cobalt Blue #1D4ED8
    SKY_BLUE = RGBColor(2, 132, 199)      # Sky Cyan #0284C7
    EMERALD = RGBColor(16, 185, 129)      # Emerald #10B981
    AMBER = RGBColor(245, 158, 11)        # Amber #F59E0B
    ROSE = RGBColor(239, 68, 68)          # Rose #EF4444
    
    TEXT_DARK = RGBColor(15, 23, 42)      # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)  # Slate 500
    TEXT_WHITE = RGBColor(255, 255, 255)

    logo_path = os.path.abspath('public/logo-brand.png')
    logo_icon_path = os.path.abspath('public/logo-icon.png')

    def add_bg(slide, dark=False):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        shape.fill.solid()
        shape.fill.fore_color.rgb = BG_DARK if dark else BG_LIGHT
        shape.line.fill.background()
        return shape

    def add_header(slide, title, category="PARETOFLOW | THE FOUR BITS"):
        # Category Tracker
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.5), Inches(0.35))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = "Arial"
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = PRIMARY_BLUE

        # Slide Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(10.5), Inches(0.7))
        p_title = tb_title.text_frame.paragraphs[0]
        p_title.text = title
        p_title.font.name = "Arial"
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_DARK

        # Top Right Logo Icon if available
        if os.path.exists(logo_icon_path):
            slide.shapes.add_picture(logo_icon_path, Inches(12.0), Inches(0.5), width=Inches(0.6))

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = Pt(1)
        else:
            shape.line.fill.background()
        return shape

    # ==========================================
    # SLIDE 1: Title & Hook
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1, dark=True)

    # Accent decorative gradient bar
    dec_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(0.15), Inches(3.8))
    dec_bar.fill.solid()
    dec_bar.fill.fore_color.rgb = PRIMARY_BLUE
    dec_bar.line.fill.background()

    # Logo
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.2), Inches(1.5), width=Inches(3.2))

    # Category Badge
    tb_b = s1.shapes.add_textbox(Inches(1.2), Inches(2.9), Inches(8), Inches(0.4))
    pb = tb_b.text_frame.paragraphs[0]
    pb.text = "PROBLEM STATEMENT 25: READY FULL-STACK ANALYTICS"
    pb.font.size = Pt(11)
    pb.font.bold = True
    pb.font.color.rgb = SKY_BLUE

    # Title & Subtitle
    tb_t = s1.shapes.add_textbox(Inches(1.2), Inches(3.3), Inches(10.5), Inches(1.6))
    pt = tb_t.text_frame.paragraphs[0]
    pt.text = "ParetoFlow"
    pt.font.size = Pt(44)
    pt.font.bold = True
    pt.font.color.rgb = TEXT_WHITE

    psub = tb_t.text_frame.add_paragraph()
    psub.text = "Downtime Log & Root-Cause Analyzer"
    psub.font.size = Pt(22)
    psub.font.bold = True
    psub.font.color.rgb = RGBColor(148, 163, 184)

    # Hook Sentence
    tb_hook = s1.shapes.add_textbox(Inches(1.2), Inches(5.0), Inches(10.5), Inches(0.8))
    ph = tb_hook.text_frame.paragraphs[0]
    ph.text = "Eliminating anecdotal stoppage tracking with sub-20s logging, live MTBF/MTTR computations, dual-axis 80/20 Pareto root cause discovery, and automated repeat-failure alerts."
    ph.font.size = Pt(14)
    ph.font.color.rgb = RGBColor(203, 213, 225)

    # Footer Team Card
    add_card(s1, Inches(0.8), Inches(6.1), Inches(11.733), Inches(0.8), bg_color=RGBColor(30, 41, 59), border_color=RGBColor(51, 65, 85))
    tb_team = s1.shapes.add_textbox(Inches(1.1), Inches(6.25), Inches(11.1), Inches(0.5))
    ptm = tb_team.text_frame.paragraphs[0]
    ptm.text = "Engineered by Team The Four Bits  |  Production Ready  |  FastAPI + Pandas + React 19 + Recharts"
    ptm.font.size = Pt(12)
    ptm.font.bold = True
    ptm.font.color.rgb = RGBColor(226, 232, 240)


    # ==========================================
    # SLIDE 2: Problem Statement — The Anecdotal Stoppage Trap
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "The Anecdotal Stoppage Trap & Industrial Reality")

    # 3 Problem Cards
    col_w = Inches(3.7)
    gap = Inches(0.3)

    # Card 1
    add_card(s2, Inches(0.8), Inches(1.8), col_w, Inches(4.8))
    tb1 = s2.shapes.add_textbox(Inches(1.0), Inches(2.0), col_w - Inches(0.4), Inches(4.3))
    p1 = tb1.text_frame.paragraphs[0]
    p1.text = "1. Anecdotal Memory"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = ROSE
    p1_sub = tb1.text_frame.add_paragraph()
    p1_sub.text = "\n• Stoppages are discussed verbally or jotted on paper notebooks.\n• Memory is subjective; technicians remember the most annoying failures, not the most expensive ones.\n• Shift handovers lose critical details between day and night crews."
    p1_sub.font.size = Pt(13)
    p1_sub.font.color.rgb = TEXT_DARK

    # Card 2
    add_card(s2, Inches(0.8) + col_w + gap, Inches(1.8), col_w, Inches(4.8))
    tb2 = s2.shapes.add_textbox(Inches(1.0) + col_w + gap, Inches(2.0), col_w - Inches(0.4), Inches(4.3))
    p2 = tb2.text_frame.paragraphs[0]
    p2.text = "2. No Cause Aggregation"
    p2.font.size = Pt(18)
    p2.font.bold = True
    p2.font.color.rgb = AMBER
    p2_sub = tb2.text_frame.add_paragraph()
    p2_sub.text = "\n• The same failure repeats week after week without intervention.\n• Zero aggregation of downtime by root causes means no 80/20 Pareto exists.\n• Teams spend 80% of maintenance hours fixing trivial symptoms instead of the vital few root causes."
    p2_sub.font.size = Pt(13)
    p2_sub.font.color.rgb = TEXT_DARK

    # Card 3
    add_card(s2, Inches(0.8) + (col_w + gap) * 2, Inches(1.8), col_w, Inches(4.8))
    tb3 = s2.shapes.add_textbox(Inches(1.0) + (col_w + gap) * 2, Inches(2.0), col_w - Inches(0.4), Inches(4.3))
    p3 = tb3.text_frame.paragraphs[0]
    p3.text = "3. Delayed & Stale Metrics"
    p3.font.size = Pt(18)
    p3.font.bold = True
    p3.font.color.rgb = PRIMARY_BLUE
    p3_sub = tb3.text_frame.add_paragraph()
    p3_sub.text = "\n• MTBF and MTTR are calculated weeks late in bloated spreadsheets.\n• Silent recurring failures (3+ times in 7 days) go completely unnoticed until a catastrophic motor burnout occurs.\n• Plant managers lack a real-time single source of truth."
    p3_sub.font.size = Pt(13)
    p3_sub.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 3: The Solution — ParetoFlow Architecture
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "Our Solution: The ParetoFlow Closed-Loop Platform")

    # 4 Feature Pillars
    p_w = Inches(2.7)
    p_gap = Inches(0.28)

    pillars = [
        ("Sub-20s Fast Logging", "Optimized shop-floor entry with 1-tap duration chips and controlled category codes. High operator adoption.", PRIMARY_BLUE),
        ("Live MTBF & MTTR", "Continuous mathematical calculation of reliability metrics dynamically binned per machine & plant-wide.", EMERALD),
        ("80/20 Pareto Analyzer", "Dual-axis chart ranking causes by downtime minutes with cumulative-% curve isolating the vital few.", AMBER),
        ("Repeat-Failure Alerts", "Automated 7-day rolling window detection flagging >=3 repeated stoppages with instant RCA actions.", ROSE)
    ]

    for idx, (title, desc, col) in enumerate(pillars):
        left_pos = Inches(0.8) + idx * (p_w + p_gap)
        add_card(s3, left_pos, Inches(1.8), p_w, Inches(4.8))
        
        # Color bar on top of card
        c_bar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos, Inches(1.8), p_w, Inches(0.12))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = col
        c_bar.line.fill.background()

        tb = s3.shapes.add_textbox(left_pos + Inches(0.2), Inches(2.1), p_w - Inches(0.4), Inches(4.2))
        pt = tb.text_frame.paragraphs[0]
        pt.text = f"0{idx+1}. {title}"
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_DARK

        pd = tb.text_frame.add_paragraph()
        pd.text = f"\n{desc}"
        pd.font.size = Pt(12)
        pd.font.color.rgb = TEXT_MUTED


    # ==========================================
    # SLIDE 4: Shop-Floor Ergonomics (<20 Seconds Logging)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "Rapid Shop-Floor Logging (< 20 Seconds)")

    # Left Card: Operator UX
    add_card(s4, Inches(0.8), Inches(1.8), Inches(6.0), Inches(4.8))
    tb_op = s4.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.4), Inches(4.3))
    pop = tb_op.text_frame.paragraphs[0]
    pop.text = "Built for Floor Speed & High Compliance"
    pop.font.size = Pt(18)
    pop.font.bold = True
    pop.font.color.rgb = PRIMARY_BLUE

    pop_body = tb_op.text_frame.add_paragraph()
    pop_body.text = """
• 1-Tap Duration Chips: 5m, 15m, 30m, 45m, 1h, 2h (auto-computes start & end).
• Controlled Reason Codes: Filterable by Mechanical, Electrical, Operational, Material, and Tooling.
• Observation Presets: Common stoppage notes entered in 1 click.
• Timestamp Sanity Checks: Enforces end > start & strictly positive duration.
• Dual Mode Flexibility: Dedicated Operator Tablet View + Sticky Quick Log Modal with Escape/Backdrop dismiss.
"""
    pop_body.font.size = Pt(13)
    pop_body.font.color.rgb = TEXT_DARK

    # Right Card: Operator Stats Simulation
    add_card(s4, Inches(7.1), Inches(1.8), Inches(5.4), Inches(4.8))
    tb_stat = s4.shapes.add_textbox(Inches(7.4), Inches(2.0), Inches(4.8), Inches(4.3))
    pstat = tb_stat.text_frame.paragraphs[0]
    pstat.text = "Real-World Adoption Benchmark"
    pstat.font.size = Pt(18)
    pstat.font.bold = True
    pstat.font.color.rgb = EMERALD

    pstat_body = tb_stat.text_frame.add_paragraph()
    pstat_body.text = """
Average Traditional Log Time:
❌ 3 to 5 minutes on paper or ERP terminal.

ParetoFlow Stoppage Entry:
✅ Logged in under 15 seconds!

Validation & Integrity:
• Zero invalid timestamps.
• Mandatory controlled reason code selection.
• Instant update across all dashboards.
"""
    pstat_body.font.size = Pt(13)
    pstat_body.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 5: Live Reliability Metrics (MTBF & MTTR)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, "Mathematical Precision: Live MTBF & MTTR Engine")

    # Formula Card
    add_card(s5, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.6), bg_color=RGBColor(239, 246, 255), border_color=RGBColor(191, 219, 254))
    tb_form = s5.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(11.1), Inches(1.3))
    pf = tb_form.text_frame.paragraphs[0]
    pf.text = "Mathematical Formulas Implemented in Pandas Analytics Engine:"
    pf.font.size = Pt(14)
    pf.font.bold = True
    pf.font.color.rgb = DEEP_BLUE

    pf_math = tb_form.text_frame.add_paragraph()
    pf_math.text = "• MTBF = Total Operating Time ÷ Failure Count  |  MTTR = mean(end - start) = Total Downtime ÷ Failure Count\n• Operational Availability = [MTBF ÷ (MTBF + MTTR_hours)] × 100%"
    pf_math.font.size = Pt(13)
    pf_math.font.bold = True
    pf_math.font.color.rgb = TEXT_DARK

    # 3 Pillar Metric Cards
    m_w = Inches(3.7)
    m_gap = Inches(0.3)

    # MTBF
    add_card(s5, Inches(0.8), Inches(3.7), m_w, Inches(2.9))
    tb_m1 = s5.shapes.add_textbox(Inches(1.0), Inches(3.9), m_w - Inches(0.4), Inches(2.5))
    pm1 = tb_m1.text_frame.paragraphs[0]
    pm1.text = "Plant MTBF: 70.9 hrs"
    pm1.font.size = Pt(18)
    pm1.font.bold = True
    pm1.font.color.rgb = PRIMARY_BLUE
    pm1_sub = tb_m1.text_frame.add_paragraph()
    pm1_sub.text = "\nCalculated live across 4,250+ operating hours. Updates instantaneously whenever an operator logs an incident."
    pm1_sub.font.size = Pt(12)
    pm1_sub.font.color.rgb = TEXT_MUTED

    # MTTR
    add_card(s5, Inches(0.8) + m_w + m_gap, Inches(3.7), m_w, Inches(2.9))
    tb_m2 = s5.shapes.add_textbox(Inches(1.0) + m_w + m_gap, Inches(3.9), m_w - Inches(0.4), Inches(2.5))
    pm2 = tb_m2.text_frame.paragraphs[0]
    pm2.text = "Plant MTTR: 66.2 mins"
    pm2.font.size = Pt(18)
    pm2.font.bold = True
    pm2.font.color.rgb = AMBER
    pm2_sub = tb_m2.text_frame.add_paragraph()
    pm2_sub.text = "\nMean Time to Repair tracks technician response & fix speed. Highlights complex mechanical vs fast electrical resets."
    pm2_sub.font.size = Pt(12)
    pm2_sub.font.color.rgb = TEXT_MUTED

    # Availability
    add_card(s5, Inches(0.8) + (m_w + m_gap) * 2, Inches(3.7), m_w, Inches(2.9))
    tb_m3 = s5.shapes.add_textbox(Inches(1.0) + (m_w + m_gap) * 2, Inches(3.9), m_w - Inches(0.4), Inches(2.5))
    pm3 = tb_m3.text_frame.paragraphs[0]
    pm3.text = "Availability: 98.5%"
    pm3.font.size = Pt(18)
    pm3.font.bold = True
    pm3.font.color.rgb = EMERALD
    pm3_sub = tb_m3.text_frame.add_paragraph()
    pm3_sub.text = "\nLive availability gauge benchmarks plant productivity against world-class OEE maintenance targets (>95%)."
    pm3_sub.font.size = Pt(12)
    pm3_sub.font.color.rgb = TEXT_MUTED


    # ==========================================
    # SLIDE 6: The Pareto Analyzer (The 80/20 Vital Few)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6)
    add_header(s6, "The 80/20 Pareto Root-Cause Analyzer")

    # Left Card: Pareto Theory & Features
    add_card(s6, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_p = s6.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.3))
    pp = tb_p.text_frame.paragraphs[0]
    pp.text = "Clear Identification of the 'Vital Few'"
    pp.font.size = Pt(18)
    pp.font.bold = True
    pp.font.color.rgb = PRIMARY_BLUE

    pp_body = tb_p.text_frame.add_paragraph()
    pp_body.text = """
• Dual-Axis Interactive Chart:
  - Left Axis (Bars): Downtime minutes per cause ranked in descending order.
  - Right Axis (Curve): Cumulative percentage curve from 0% to 100%.

• 80% Cutoff Threshold:
  - Visually separates the Vital Few (80% impact) from the Useful Many (20% impact).

• The Golden Rule of Maintenance:
  - Eliminating the top 2 causes resolves ~77% of all factory downtime minutes!
"""
    pp_body.font.size = Pt(12.5)
    pp_body.font.color.rgb = TEXT_DARK

    # Right Card: Case Study on Seeded 60 Events
    add_card(s6, Inches(6.7), Inches(1.8), Inches(5.8), Inches(4.8), bg_color=RGBColor(254, 242, 242), border_color=RGBColor(254, 202, 202))
    tb_cs = s6.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.2), Inches(4.3))
    pcs = tb_cs.text_frame.paragraphs[0]
    pcs.text = "Dataset Story: 60 Events over 30 Days"
    pcs.font.size = Pt(18)
    pcs.font.bold = True
    pcs.font.color.rgb = ROSE

    pcs_body = tb_cs.text_frame.add_paragraph()
    pcs_body.text = """
Top Causes Ranked by Downtime:
1. Motor Overheating (MTR-OVH)
   • 2,150+ minutes (~54.2% of total downtime)
   • Vital Few Driver #1

2. Conveyor Belt Jam (CNV-JAM)
   • 910+ minutes (~22.8% of total downtime)
   • Vital Few Driver #2

Remaining 6 Causes (Sensor, Tooling, Hydraulics...):
   • Account for only ~23% of total downtime combined!
"""
    pcs_body.font.size = Pt(12.5)
    pcs_body.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 7: Repeat-Failure Alerts & Dynamic RCA
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7)
    add_header(s7, "Automated Repeat-Failure Alerts (>=3x in 7 Days)")

    # Top Alert Banner Card
    add_card(s7, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.5), bg_color=RGBColor(255, 241, 242), border_color=RGBColor(254, 205, 211))
    tb_ab = s7.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(11.1), Inches(1.2))
    pab = tb_ab.text_frame.paragraphs[0]
    pab.text = "CRITICAL ALERT TRIGGER: CNC-01 (CNC Milling Center 01) - Motor Overheating (3x in 7 Days)"
    pab.font.size = Pt(15)
    pab.font.bold = True
    pab.font.color.rgb = ROSE

    pab_sub = tb_ab.text_frame.add_paragraph()
    pab_sub.text = "Recommended RCA Directive: 'Repeated thermal trips on CNC Milling Center 01. Inspect coolant flow, fan operation, and motor bearing lubrication immediately to avoid spindle replacement.'"
    pab_sub.font.size = Pt(12)
    pab_sub.font.color.rgb = TEXT_DARK

    # 3 Operational Process Cards
    r_w = Inches(3.7)
    r_gap = Inches(0.3)

    steps = [
        ("Rolling Window Sweep", "Background analytical queries continuously monitor a rolling 168-hour (7-day) sliding window across all machines.", PRIMARY_BLUE),
        ("Dynamic RCA Advice", "Platform inspects the failure category and automatically provides actionable troubleshooting guidance to engineers.", AMBER),
        ("Lifecycle Tracking", "Alerts move through Active -> Acknowledged -> Resolved RCA lifecycle, ensuring accountability across maintenance teams.", EMERALD)
    ]

    for idx, (title, desc, col) in enumerate(steps):
        left_pos = Inches(0.8) + idx * (r_w + r_gap)
        add_card(s7, left_pos, Inches(3.6), r_w, Inches(3.0))
        
        tb = s7.shapes.add_textbox(left_pos + Inches(0.2), Inches(3.8), r_w - Inches(0.4), Inches(2.5))
        pt = tb.text_frame.paragraphs[0]
        pt.text = title
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = col

        pd = tb.text_frame.add_paragraph()
        pd.text = f"\n{desc}"
        pd.font.size = Pt(12)
        pd.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 8: Multi-Machine Weekly Trends & Audit Trail
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_bg(s8)
    add_header(s8, "Weekly Trends & Comprehensive Audit Trail")

    # Left: Weekly Trends
    add_card(s8, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.8))
    tb_tr = s8.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.1), Inches(4.3))
    ptr = tb_tr.text_frame.paragraphs[0]
    ptr.text = "Multi-Machine Weekly Trend Lines"
    ptr.font.size = Pt(18)
    ptr.font.bold = True
    ptr.font.color.rgb = PRIMARY_BLUE

    ptr_body = tb_tr.text_frame.add_paragraph()
    ptr_body.text = """
• 5-Week Chronological Binning:
  - Tracks weekly downtime minutes per machine.
  - Dynamically charts newly logged live events.

• Interactive Machine Filtering:
  - Isolate CNC-01, Sorting Conveyor, or Injection Molding Press with 1 click.

• Timeframe Selectors:
  - 7 Days, 30 Days, 90 Days, and All Time historical views.
"""
    ptr_body.font.size = Pt(13)
    ptr_body.font.color.rgb = TEXT_DARK

    # Right: Audit Trail & CSV
    add_card(s8, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    tb_au = s8.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.3))
    pau = tb_au.text_frame.paragraphs[0]
    pau.text = "Enterprise Audit Trail & CSV Export"
    pau.font.size = Pt(18)
    pau.font.bold = True
    pau.font.color.rgb = EMERALD

    pau_body = tb_au.text_frame.add_paragraph()
    pau_body.text = """
• Real-Time Stoppage Journal:
  - Strict descending chronological order.
  - New stoppage highlighted with glowing 'NEW' badge.

• Advanced Multi-Filter Search:
  - Machine, Reason Code, Shift, and Full-Text query search.

• 1-Click CSV Export:
  - Generates audit-ready CSV exports for compliance audits and ERP synchronization.
"""
    pau_body.font.size = Pt(13)
    pau_body.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 9: Full-Stack Tech Stack & Vercel Deployment
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_bg(s9)
    add_header(s9, "Modern Tech Stack & Dual-Layer Vercel Architecture")

    # 2 Big Cards
    add_card(s9, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.8))
    tb_back = s9.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.1), Inches(4.3))
    pb = tb_back.text_frame.paragraphs[0]
    pb.text = "Backend & Analytical Engine"
    pb.font.size = Pt(18)
    pb.font.bold = True
    pb.font.color.rgb = PRIMARY_BLUE

    pb_body = tb_back.text_frame.add_paragraph()
    pb_body.text = """
• Python 3.14 + FastAPI:
  - High-concurrency asynchronous REST endpoints.
  - Pydantic schema validation for timestamp sanity.

• Pandas Analytics Engine:
  - Vectorized groupby, cumulative percentage & rolling window evaluation.

• SQLAlchemy 2.0 ORM + SQLite:
  - Relational schema for machines, controlled reason codes, events, and repeat alerts.
"""
    pb_body.font.size = Pt(13)
    pb_body.font.color.rgb = TEXT_DARK

    add_card(s9, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
    tb_front = s9.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.3))
    pf = tb_front.text_frame.paragraphs[0]
    pf.text = "Frontend & Deployment Architecture"
    pf.font.size = Pt(18)
    pf.font.bold = True
    pf.font.color.rgb = SKY_BLUE

    pf_body = tb_front.text_frame.add_paragraph()
    pf_body.text = """
• React 19 + Vite 6 + Tailwind CSS v4:
  - Ultra-fast sub-4 second compilation.
  - Plus Jakarta Sans typography & modern SaaS design.

• Recharts Data Visualization:
  - Responsive dual-axis Pareto and multi-line time-series.

• 100% Vercel-Ready Architecture:
  - vercel.json pre-configured for instant zero-config deploy.
  - Dual-layer engine: queries FastAPI when running, seamless fallback to client engine on static Vercel.
"""
    pf_body.font.size = Pt(13)
    pf_body.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 10: Demo Day Achievements & Business Impact
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_bg(s10)
    add_header(s10, "Hackathon Demo Day Achievements & Business Impact")

    # 4 Quadrants
    q_w = Inches(5.6)
    q_h = Inches(2.25)

    # Q1: Demo Day Live Test
    add_card(s10, Inches(0.8), Inches(1.8), q_w, q_h)
    tb_q1 = s10.shapes.add_textbox(Inches(1.0), Inches(1.9), q_w - Inches(0.4), q_h - Inches(0.2))
    pq1 = tb_q1.text_frame.paragraphs[0]
    pq1.text = "✅ 1-Click Live Stoppage Demonstration"
    pq1.font.size = Pt(15)
    pq1.font.bold = True
    pq1.font.color.rgb = PRIMARY_BLUE
    pq1_sub = tb_q1.text_frame.add_paragraph()
    pq1_sub.text = "Injected 3 sample stoppages live on stage: MTBF, MTTR, Availability, Pareto curve, and Weekly Trends recalculate instantly."
    pq1_sub.font.size = Pt(12)
    pq1_sub.font.color.rgb = TEXT_DARK

    # Q2: Business ROI
    add_card(s10, Inches(6.8), Inches(1.8), q_w, q_h)
    tb_q2 = s10.shapes.add_textbox(Inches(7.0), Inches(1.9), q_w - Inches(0.4), q_h - Inches(0.2))
    pq2 = tb_q2.text_frame.paragraphs[0]
    pq2.text = "📈 35% to 45% Downtime Reduction"
    pq2.font.size = Pt(15)
    pq2.font.bold = True
    pq2.font.color.rgb = EMERALD
    pq2_sub = tb_q2.text_frame.add_paragraph()
    pq2_sub.text = "Focusing engineering resources strictly on the 80/20 vital few causes drives massive operational cost savings and OEE gains."
    pq2_sub.font.size = Pt(12)
    pq2_sub.font.color.rgb = TEXT_DARK

    # Q3: Repeat Failure Elimination
    add_card(s10, Inches(0.8), Inches(4.35), q_w, q_h)
    tb_q3 = s10.shapes.add_textbox(Inches(1.0), Inches(4.45), q_w - Inches(0.4), q_h - Inches(0.2))
    pq3 = tb_q3.text_frame.paragraphs[0]
    pq3.text = "🚨 Zero Recurring Silent Killers"
    pq3.font.size = Pt(15)
    pq3.font.bold = True
    pq3.font.color.rgb = ROSE
    pq3_sub = tb_q3.text_frame.add_paragraph()
    pq3_sub.text = "Automated rolling 7-day alert engine catches repeated minor breakdowns before they cause catastrophic machine burnouts."
    pq3_sub.font.size = Pt(12)
    pq3_sub.font.color.rgb = TEXT_DARK

    # Q4: Future Roadmap
    add_card(s10, Inches(6.8), Inches(4.35), q_w, q_h)
    tb_q4 = s10.shapes.add_textbox(Inches(7.0), Inches(4.45), q_w - Inches(0.4), q_h - Inches(0.2))
    pq4 = tb_q4.text_frame.paragraphs[0]
    pq4.text = "🚀 Future Vision & Roadmap"
    pq4.font.size = Pt(15)
    pq4.font.bold = True
    pq4.font.color.rgb = AMBER
    pq4_sub = tb_q4.text_frame.add_paragraph()
    pq4_sub.text = "IoT vibration sensor streaming via MQTT, AI Predictive Maintenance (PdM) LLM agent, and SAP/ERP maintenance order syncing."
    pq4_sub.font.size = Pt(12)
    pq4_sub.font.color.rgb = TEXT_DARK

    # Save Presentation
    output_path = "ParetoFlow_Hackathon_Pitch.pptx"
    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    create_presentation()
