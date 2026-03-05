Here is a structured technical markdown document designed to be fed directly into an IDE agent like Cursor. It translates your mascot guidelines into a functional "Source of Truth" architecture.

# ---

**Technical Specification: Scout Mascot Brand Portal**

## **1\. Project Overview**

The goal is to build a high-fidelity, interactive "Mascot Guidelines" sub-section for the brand website. This portal must serve as the primary reference for designers and developers, mirroring the structural clarity of the Duolingo Design System.

## **2\. Information Architecture**

The page should be divided into four primary interactive modules:

### **Module 1: The Emotional Strategy & Layers**

* **Concept**: Explain the "Three Layers" approach to mascot implementation.

* **Data Points**:  
  * **Product Layer**: Focuses on clarity and usability.

  * **Marketing Layer**: Focuses on emotional engagement.

  * **Physical Layer**: Focuses on brand memorability.

* **Visual Logic**: 2D assets drive functional intelligence, 3D encourages emotional warmth, and plush encourages physical attachment.

### **Module 2: 2D Implementation (Product Environment)**

* **Usage Contexts**: Web/Mobile UI, Dashboard empty states, Tooltips, Form feedback, Email illustrations, and Help center documentation.

* **Technical Rendering Rules**:  
  * **Format**: Flat vector only.

  * **Shading**: Minimal cel shading.

  * **Background**: Transparent or white.

  * **Restrictions**: No realistic textures.

* **Rationale**: Must remain clean, lightweight, scalable, and consistent with interface geometry.

### **Module 3: 3D Implementation (Marketing Layer)**

* **Usage Contexts**: Website hero sections, Landing pages, Social campaigns, App store graphics, Product videos, Explainer animations, Investor decks, and Paid ads.

* **Technical Rendering Rules**:  
  * **Texture**: Soft groomed fur.

  * **Environment**: Warm studio lighting with a clean, clutter-free background.

  * **Optics**: Controlled depth of field.

* **Rationale**: Designed for emotional pull, higher attention capture, and premium brand perception.

### **Module 4: Real-World & Merchandise**

* **Plush Toy Specs**:  
  * **Design Adjustments**: Simplified vest detail, slightly increased head size for "cuteness," and embroidered eyes.

  * **Safety**: Remove small zipper pulls (choking hazard).

  * **Materials**: Short plush microfiber with soft cotton fill and a velvet nose.

* **Convention/Booth Assets**:  
  * **Option A (Statue)**: 3-5 ft tall, matte paint finish, stable base with logo.

  * **Option B (Suit)**: Foam character suit with oversized head, cooling ventilation, and large eye expression.

  * **Strict Rule**: Never exaggerate into theme-park cartoon territory.

## ---

**3\. UI/UX Component Requirements (For Cursor)**

When generating code, the IDE should prioritize the following components:

| Component | Description |
| :---- | :---- |
| **Asset Toggle** | A side-by-side comparison toggle allowing users to switch between the 2D and 3D versions of the same pose. |
| **Rule Cards** | Styled "Do" and "Don't" blocks (e.g., Do: 2D Stickers; Don't: Website loading animations).  |
| **Spec Table** | A clean technical table for the AR/Photo Op requirements: Subtle breathing, eye tracking, and tail wag.  |
| **Download Grid** | A grid of cards for merchandise-approved assets: Stickers, Notebook covers, and T-shirts.  |

## ---

**4\. Forbidden Implementations (Guardrails)**

* Do not use complex scene compositions or over-detailed illustrations.

* Avoid using the mascot for pins (unless face only).

* Avoid website loading animations.

---

**Would you like me to generate a specific Tailwind CSS configuration or a React component template for the "2D vs 3D" comparison section?**