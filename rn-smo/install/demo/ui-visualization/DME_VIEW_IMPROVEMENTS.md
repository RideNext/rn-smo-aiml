# DME View Improvements

## Summary of Changes

The DME (Data Management and Exposure) view has been significantly enhanced to provide better visualization and usability when viewing producers and consumers.

## Key Improvements

### 1. **Better Title**
   - **Old**: "Dme"
   - **New**: "DME - Overview of RAN Energy Performance"
   - **Subtitle**: "Data Management and Exposure - Producers and Consumers"

### 2. **Expandable Card Interface**
   All producer and consumer cards are now **collapsible/expandable**:
   - Click on any card to expand and view detailed information
   - Click again to collapse and keep the view clean
   - Visual indicator (chevron icon) shows expand/collapse state
   - Smooth transitions and hover effects

### 3. **Improved Data Visualization**

#### **Producers View**
   - **Collapsed State** (Default):
     - Producer ID (name)
     - Status badge (Active)
     - Supported info types (inline)
   
   - **Expanded State** (Click to reveal):
     - Status Callback URL (monospace, with background)
     - Job Callback URL (monospace, with background)

#### **Consumers View**
   - **Collapsed State** (Default):
     - Consumer job identity
     - Status badge (Active)
     - Info type and owner (inline)
   
   - **Expanded State** (Click to reveal):
     - Target URI (monospace)
     - **Job Configuration** (beautifully formatted):
       - Syntax-highlighted JSON
       - Scrollable container (max 300px height)
       - Dark bordered box for better readability
       - Info icon for visual clarity

### 4. **Visual Enhancements**
   - Color-coded by type:
     - **Producers**: Blue theme (#3B82F6)
     - **Consumers**: Purple theme (#A855F7)
   - Monospace font for URLs and technical data
   - Improved spacing and padding
   - Better contrast for readability
   - Hover effects on expandable cards
   - CheckCircle icon for active status

### 5. **Better Job Data Display**
   When viewing consumer jobs, the job definition/configuration is now:
   - Displayed in a dedicated, highlighted section
   - Properly formatted JSON with indentation
   - Easy to scroll if content is long
   - Visually separated from other metadata

## Usage

1. **Navigate to DME View**: Click on "Dme" in the sidebar
2. **Switch Tabs**: Toggle between Producers and Consumers
3. **Expand Details**: Click on any card to see full details
4. **View Job Config**: Expand a consumer card to see its complete job configuration

## Benefits

- ✅ **Cleaner Interface**: Cards are compact by default
- ✅ **Better Readability**: Job configurations are properly formatted and easy to read
- ✅ **Quick Overview**: See all producers/consumers at a glance
- ✅ **Detailed Inspection**: Click to dive into details when needed
- ✅ **Professional Look**: Consistent styling with the rest of the dashboard

## Technical Details

- **Component**: `DmeView.jsx`
- **State Management**: Uses React hooks (`useState`) for expand/collapse state
- **Performance**: Efficient re-renders, only expanded items show details
- **Responsive**: Works well on different screen sizes
- **Accessibility**: Proper button roles and hover states

---

**Last Updated**: 2025-11-26  
**Version**: 2.0 - Expandable Cards with Enhanced Job Visualization
