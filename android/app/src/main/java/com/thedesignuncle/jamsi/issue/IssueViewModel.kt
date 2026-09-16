package com.thedesignuncle.jamsi.issue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.thedesignuncle.jamsi.model.IssueType

class IssueViewModel(private val repository: IssueRepository) : ViewModel() {
    private val _state = MutableStateFlow(IssueUiState())
    val state: StateFlow<IssueUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeSelected().collectLatest { issue ->
                // StateFlow emits its initial null before Firestore finishes loading.
                // Keep the loading UI visible until data arrives or refresh() reports a real failure.
                if (issue == null) return@collectLatest
                _state.update {
                    it.copy(
                        isInitialLoading = false,
                        issue = issue,
                        selectedDate = issue.publishDate,
                        error = null,
                    )
                }
            }
        }
        viewModelScope.launch { repository.observeConfig().collectLatest { config -> _state.update { it.copy(appConfig = config) } } }
        viewModelScope.launch { repository.observeMarkets().collectLatest { markets -> _state.update { it.copy(marketSnapshot = markets) } } }
        refresh()
    }

    fun refresh() = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { repository.refreshLatest(_state.value.selectedType); repository.refreshConfig(); repository.refreshMarkets(); loadDates() }
            .onFailure { error -> _state.update { it.copy(isInitialLoading = false, isStaleCache = it.issue != null, error = if (it.issue == null) "네트워크 연결을 확인해 주세요." else error.message) } }
    }

    fun selectType(type: IssueType) = viewModelScope.launch {
        _state.update { it.copy(selectedType = type, isDateSheetOpen = false, isInitialLoading = it.issue == null) }
        runCatching { repository.refreshLatest(type); loadDates() }.onFailure { _state.update { current -> current.copy(error = "해당 발행본을 불러오지 못했습니다.") } }
    }

    fun selectDate(date: String) = viewModelScope.launch {
        _state.update { it.copy(isDateSheetOpen = false) }
        runCatching { repository.select(_state.value.selectedType, date) }.onFailure { _state.update { current -> current.copy(error = "선택한 날짜의 발행본을 불러오지 못했습니다.") } }
    }

    fun setDateSheet(open: Boolean) = _state.update { it.copy(isDateSheetOpen = open) }
    private suspend fun loadDates() { _state.update { it.copy(availableDates = repository.availableDates(it.selectedType)) } }
}

class IssueViewModelFactory(private val repository: IssueRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = IssueViewModel(repository) as T
}
